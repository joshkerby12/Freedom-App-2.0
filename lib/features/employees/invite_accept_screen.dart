import 'package:flutter/material.dart';

import 'layouts/mobile/invite_accept_screen_mobile.dart';

class InviteAcceptScreen extends StatelessWidget {
  const InviteAcceptScreen({super.key, required this.token});

  final String token;

  @override
  Widget build(BuildContext context) {
    return InviteAcceptScreenMobile(token: token);
  }
}
