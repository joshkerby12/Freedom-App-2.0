import 'package:math_expressions/math_expressions.dart';

class FormulaResult {
  const FormulaResult._({this.value, this.error});

  const FormulaResult.success(double value) : this._(value: value);

  const FormulaResult.failure(String error) : this._(error: error);

  final double? value;
  final String? error;

  bool get isSuccess => value != null && error == null;
}

class FormulaEngine {
  static final RegExp _variableTokenPattern = RegExp(r'[a-zA-Z_][a-zA-Z0-9_]*');

  static FormulaResult evaluate(String formula, Map<String, double> variables) {
    try {
      final normalizedVariables = {
        for (final entry in variables.entries)
          _normalizeKey(entry.key): entry.value,
      };

      final referencedVariables = _extractReferencedVariables(formula);
      final missing = referencedVariables
          .where((variable) => !normalizedVariables.containsKey(variable))
          .toList();

      if (missing.isNotEmpty) {
        return FormulaResult.failure(
          'Missing variables: ${missing.join(', ')}',
        );
      }

      final parser = ShuntingYardParser();
      final expression = parser.parse(formula);
      final contextModel = ContextModel();

      for (final variable in normalizedVariables.entries) {
        contextModel.bindVariableName(variable.key, Number(variable.value));
      }

      final result = RealEvaluator(
        contextModel,
      ).evaluate(expression).toDouble();
      if (result.isNaN || result.isInfinite) {
        return const FormulaResult.failure(
          'Formula produced an invalid number.',
        );
      }

      return FormulaResult.success(result);
    } catch (error) {
      return FormulaResult.failure(error.toString());
    }
  }

  static String normalizeInputLabel(String inputLabel) =>
      _normalizeKey(inputLabel);

  static String _normalizeKey(String value) {
    return value.trim().toLowerCase().replaceAll(RegExp(r'\s+'), '_');
  }

  static Set<String> _extractReferencedVariables(String formula) {
    const builtinTokens = {
      'sin',
      'cos',
      'tan',
      'asin',
      'acos',
      'atan',
      'sqrt',
      'ln',
      'log',
      'abs',
      'floor',
      'ceil',
      'round',
      'pow',
      'e',
      'pi',
    };

    final matches = _variableTokenPattern.allMatches(formula);
    return matches
        .map((match) => match.group(0) ?? '')
        .map(_normalizeKey)
        .where((token) => token.isNotEmpty)
        .where((token) => !builtinTokens.contains(token))
        .toSet();
  }
}
