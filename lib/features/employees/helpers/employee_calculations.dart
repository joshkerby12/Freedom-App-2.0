import '../models/employee.dart';

String suggestedDisplayName({
  required String firstName,
  required String lastName,
}) {
  final first = firstName.trim();
  final last = lastName.trim();
  return [first, last].where((part) => part.isNotEmpty).join(' ').trim();
}

String resolvedDisplayName(Employee employee) {
  final display = employee.displayName?.trim();
  if (display != null && display.isNotEmpty) {
    return display;
  }
  return suggestedDisplayName(
    firstName: employee.firstName,
    lastName: employee.lastName,
  );
}

bool isTerminalStatus(String status) {
  return status == 'terminated' || status == 'resigned';
}

bool isValidStatusTransition({required String from, required String to}) {
  if (from == to) {
    return true;
  }
  if (from == 'terminated' || from == 'resigned') {
    return false;
  }

  const allowedTransitions = {
    'active': {'on_leave', 'terminated', 'resigned'},
    'on_leave': {'active', 'terminated', 'resigned'},
  };

  return allowedTransitions[from]?.contains(to) ?? false;
}
