import 'package:flutter/material.dart';

Future<void> main() async {
  runApp(const FreedomApp());
}

class FreedomApp extends StatelessWidget {
  const FreedomApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(home: Scaffold(body: SizedBox.expand()));
  }
}
