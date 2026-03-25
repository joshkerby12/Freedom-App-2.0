class AppException implements Exception {
  final String message;
  const AppException(this.message);

  @override
  String toString() => 'AppException: $message';
}

class AuthAppException extends AppException {
  const AuthAppException(super.message);
}

class DatabaseException extends AppException {
  const DatabaseException(super.message);
}

class NetworkException extends AppException {
  const NetworkException(super.message);
}

class PermissionException extends AppException {
  const PermissionException(super.message);
}
