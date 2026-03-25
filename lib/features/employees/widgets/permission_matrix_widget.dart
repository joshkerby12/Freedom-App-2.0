import 'package:flutter/material.dart';

class PermissionMatrixWidget extends StatelessWidget {
  const PermissionMatrixWidget({
    super.key,
    required this.permissionKeys,
    required this.values,
    required this.onToggle,
  });

  final List<String> permissionKeys;
  final Map<String, bool> values;
  final Future<void> Function(String permissionKey, bool granted) onToggle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: permissionKeys.length,
        separatorBuilder: (_, _) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final key = permissionKeys[index];
          final granted = values[key] ?? false;

          return SwitchListTile(
            dense: true,
            title: Text(key),
            value: granted,
            onChanged: (value) => onToggle(key, value),
          );
        },
      ),
    );
  }
}
