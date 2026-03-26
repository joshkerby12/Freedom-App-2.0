import 'package:flutter/material.dart';

import 'layouts/mobile/crew_form_screen_mobile.dart';

class CrewFormScreen extends StatelessWidget {
  const CrewFormScreen({super.key, this.crewId});

  final String? crewId;

  @override
  Widget build(BuildContext context) {
    return CrewFormScreenMobile(crewId: crewId);
  }
}
