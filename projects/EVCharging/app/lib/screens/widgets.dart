import 'package:material_ui/material_ui.dart';

import '../config/client_config.dart';

/// Client name and mark at the top of each login screen.
class BrandHeader extends StatelessWidget {
  const BrandHeader({super.key, required this.config});
  final ClientConfig config;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: config.primary,
          child: Text(config.mark, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
        ),
        const SizedBox(width: 10),
        Text(config.displayName, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
      ],
    );
  }
}

/// Language choices, shown with each language's own name.
class LanguageChips extends StatelessWidget {
  const LanguageChips({super.key, required this.config, required this.current, required this.onChanged});

  final ClientConfig config;
  final Locale current;
  final ValueChanged<Locale> onChanged;

  static const names = {'en': 'English', 'hi': 'हिन्दी', 'mr': 'मराठी'};

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      children: [
        for (final code in config.languages)
          ChoiceChip(
            label: Text(names[code] ?? code),
            selected: current.languageCode == code,
            onSelected: (_) => onChanged(Locale(code)),
          ),
      ],
    );
  }
}
