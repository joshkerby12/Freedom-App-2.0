import 'package:flutter/material.dart';

import 'layouts/mobile/maintenance_form_screen_mobile.dart';

class MaintenanceFormScreen extends StatelessWidget {
  const MaintenanceFormScreen({super.key, required this.equipmentId});

  final String equipmentId;

  @override
  Widget build(BuildContext context) {
    return MaintenanceFormScreenMobile(equipmentId: equipmentId);
  }
}
