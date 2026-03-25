String? requiredText(String? value, {required String fieldLabel}) {
  if ((value ?? '').trim().isEmpty) {
    return '$fieldLabel is required';
  }
  return null;
}

String? optionalEmail(String? value, {required String fieldLabel}) {
  final normalized = (value ?? '').trim();
  if (normalized.isEmpty) {
    return null;
  }
  final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
  if (!emailRegex.hasMatch(normalized)) {
    return 'Enter a valid $fieldLabel';
  }
  return null;
}

String? optionalCurrency(String? value, {required String fieldLabel}) {
  final normalized = (value ?? '').trim();
  if (normalized.isEmpty) {
    return null;
  }

  final parsed = double.tryParse(normalized);
  if (parsed == null || parsed < 0) {
    return 'Enter a valid $fieldLabel';
  }

  return null;
}

String? optionalLastFour(String? value) {
  final normalized = (value ?? '').trim();
  if (normalized.isEmpty) {
    return null;
  }

  if (!RegExp(r'^\d{4}$').hasMatch(normalized)) {
    return 'Card last four must be 4 digits';
  }

  return null;
}
