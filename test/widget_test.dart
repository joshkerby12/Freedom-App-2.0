import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('Basic widget smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: Text('Ground Control Pro'))),
    );

    expect(find.text('Ground Control Pro'), findsOneWidget);
  });
}
