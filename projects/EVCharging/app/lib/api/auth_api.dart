import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/client_config.dart';

/// A failed call. [reason] matches the server's codes: WRONG_CODE, EXPIRED, TOO_MANY_ATTEMPTS,
/// RATE_LIMITED, INVALID_PHONE, SMS_UNAVAILABLE, or NETWORK when the server cannot be reached.
class AuthFailure implements Exception {
  AuthFailure(this.reason, {this.retryAfterSeconds});
  final String reason;
  final int? retryAfterSeconds;

  @override
  String toString() => 'AuthFailure($reason)';
}

abstract class AuthApi {
  Future<ClientConfig> fetchConfig();
  Future<void> requestOtp(String phone);
  Future<String> verifyOtp(String phone, String code);
  Future<void> recordConsent(String token, String consentType, String version);
}

class HttpAuthApi implements AuthApi {
  HttpAuthApi(this.baseUrl, {http.Client? client}) : _client = client ?? http.Client();

  final String baseUrl;
  final http.Client _client;

  @override
  Future<ClientConfig> fetchConfig() async {
    final body = await _get('/api/config');
    return ClientConfig.fromJson(body);
  }

  @override
  Future<void> requestOtp(String phone) async {
    await _post('/api/auth/otp/request', {'phone': phone});
  }

  @override
  Future<String> verifyOtp(String phone, String code) async {
    final body = await _post('/api/auth/otp/verify', {'phone': phone, 'code': code});
    return body['token'] as String;
  }

  @override
  Future<void> recordConsent(String token, String consentType, String version) async {
    await _post('/api/consent', {'consentType': consentType, 'version': version},
        token: token);
  }

  Future<Map<String, dynamic>> _get(String path) async {
    final response = await _send(() => _client.get(Uri.parse('$baseUrl$path')));
    return _decode(response);
  }

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> json, {String? token}) async {
    final headers = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
    final response = await _send(() => _client.post(
          Uri.parse('$baseUrl$path'),
          headers: headers,
          body: jsonEncode(json),
        ));
    return _decode(response);
  }

  Future<http.Response> _send(Future<http.Response> Function() call) async {
    try {
      return await call();
    } catch (_) {
      throw AuthFailure('NETWORK');
    }
  }

  Map<String, dynamic> _decode(http.Response response) {
    final text = response.body.isEmpty ? '{}' : response.body;
    final body = jsonDecode(text) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    throw AuthFailure(
      body['reason'] as String? ?? 'NETWORK',
      retryAfterSeconds: body['retryAfterSeconds'] as int?,
    );
  }
}
