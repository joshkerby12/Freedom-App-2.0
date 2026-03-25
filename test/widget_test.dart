import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('Basic widget smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: Text('Freedom App 2.0'))),
    );

    expect(find.text('Freedom App 2.0'), findsOneWidget);
  });
}
