import 'package:material_ui/material_ui.dart';

import '../api/auth_api.dart';
import '../config/client_config.dart';
import '../errors.dart';
import '../l10n/app_localizations.dart';
import 'home_screen.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key, required this.config, required this.api, required this.token});

  final ClientConfig config;
  final AuthApi api;
  final String token;

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool _terms = false;
  bool _marketing = false;
  String? _error;
  bool _busy = false;

  Future<void> _continue() async {
    final l = AppLocalizations.of(context)!;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.api.recordConsent(widget.token, 'TERMS', '1');
      if (_marketing) {
        await widget.api.recordConsent(widget.token, 'MARKETING', '1');
      }
      if (!mounted) return;
      await Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => HomeScreen(config: widget.config)),
        (_) => false,
      );
    } on AuthFailure catch (e) {
      setState(() => _error = authErrorMessage(l, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l.consentTitle)),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: ListView(
          children: [
            CheckboxListTile(
              key: const Key('terms'),
              value: _terms,
              onChanged: (v) => setState(() => _terms = v ?? false),
              title: Text(l.acceptTerms),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            CheckboxListTile(
              key: const Key('marketing'),
              value: _marketing,
              onChanged: (v) => setState(() => _marketing = v ?? false),
              title: Text(l.marketingOffers),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            const SizedBox(height: 8),
            Text(l.consentNote),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            FilledButton(
              key: const Key('continue'),
              onPressed: (_terms && !_busy) ? _continue : null,
              child: Text(l.continueButton),
            ),
          ],
        ),
      ),
    );
  }
}
