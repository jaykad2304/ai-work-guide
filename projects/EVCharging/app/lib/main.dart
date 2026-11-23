import 'dart:convert';

import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';

import 'api/auth_api.dart';
import 'app.dart';
import 'config/client_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // One build per client: CLIENT_ID picks the bundled fallback file.
  const clientId = String.fromEnvironment('CLIENT_ID', defaultValue: 'client-a');
  const apiBase = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:8080');

  final bundled = ClientConfig.fromJson(
      jsonDecode(await rootBundle.loadString('assets/client/$clientId.json')) as Map<String, dynamic>);
  final api = HttpAuthApi(apiBase);

  // Prefer the server's settings; fall back to the bundled copy when offline.
  ClientConfig config;
  try {
    config = await api.fetchConfig();
  } catch (_) {
    config = bundled;
  }

  runApp(CustomerApp(config: config, api: api));
}
