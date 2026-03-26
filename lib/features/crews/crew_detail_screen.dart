import 'package:flutter/material.dart';

import 'layouts/mobile/crew_detail_screen_mobile.dart';

class CrewDetailScreen extends StatelessWidget {
  const CrewDetailScreen({super.key, required this.crewId});

  final String crewId;

  @override
  Widget build(BuildContext context) {
    return CrewDetailScreenMobile(crewId: crewId);
  }
}
