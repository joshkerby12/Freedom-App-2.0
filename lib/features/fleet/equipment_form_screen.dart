import 'package:flutter/material.dart';

import 'layouts/mobile/equipment_form_screen_mobile.dart';

class EquipmentFormScreen extends StatelessWidget {
  const EquipmentFormScreen({super.key, this.equipmentId});

  final String? equipmentId;

  @override
  Widget build(BuildContext context) {
    return EquipmentFormScreenMobile(equipmentId: equipmentId);
  }
}
