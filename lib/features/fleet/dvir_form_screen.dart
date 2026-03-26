import 'package:flutter/material.dart';

import 'layouts/mobile/dvir_form_screen_mobile.dart';

class DvirFormScreen extends StatelessWidget {
  const DvirFormScreen({
    super.key,
    required this.equipmentId,
    this.inspectionType = 'pre_trip',
  });

  final String equipmentId;
  final String inspectionType;

  @override
  Widget build(BuildContext context) {
    return DvirFormScreenMobile(
      equipmentId: equipmentId,
      inspectionType: inspectionType,
    );
  }
}
