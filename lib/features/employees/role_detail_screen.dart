import 'package:flutter/material.dart';

import 'layouts/mobile/role_detail_screen_mobile.dart';

class RoleDetailScreen extends StatelessWidget {
  const RoleDetailScreen({super.key, required this.roleId});

  final String roleId;

  @override
  Widget build(BuildContext context) {
    return RoleDetailScreenMobile(roleId: roleId);
  }
}
