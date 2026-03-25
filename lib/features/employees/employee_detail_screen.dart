import 'package:flutter/material.dart';

import 'layouts/mobile/employee_detail_screen_mobile.dart';

class EmployeeDetailScreen extends StatelessWidget {
  const EmployeeDetailScreen({super.key, required this.employeeId});

  final String employeeId;

  @override
  Widget build(BuildContext context) {
    return EmployeeDetailScreenMobile(employeeId: employeeId);
  }
}
