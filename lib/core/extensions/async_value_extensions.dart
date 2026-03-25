import 'package:flutter_riverpod/flutter_riverpod.dart';

extension AsyncValueExtensions<T> on AsyncValue<T> {
  T? get valueOrNull {
    return when(
      data: (value) => value,
      error: (_, _) => null,
      loading: () => null,
    );
  }
}
