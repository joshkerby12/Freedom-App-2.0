import 'package:flutter/material.dart';

import 'layouts/mobile/equipment_detail_screen_mobile.dart';

class EquipmentDetailScreen extends StatelessWidget {
  const EquipmentDetailScreen({super.key, required this.equipmentId});

  final String equipmentId;

  @override
  Widget build(BuildContext context) {
    return EquipmentDetailScreenMobile(equipmentId: equipmentId);
  }
}
