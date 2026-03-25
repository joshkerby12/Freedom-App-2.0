import 'package:flutter/material.dart';

import 'layouts/mobile/employee_form_screen_mobile.dart';

class EmployeeFormScreen extends StatelessWidget {
  const EmployeeFormScreen({super.key, this.employeeId});

  final String? employeeId;

  @override
  Widget build(BuildContext context) {
    return EmployeeFormScreenMobile(employeeId: employeeId);
  }
}
