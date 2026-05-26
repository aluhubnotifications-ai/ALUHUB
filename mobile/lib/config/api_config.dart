/// Backend API configuration.
///
/// Override at build/run time, e.g.:
///   flutter run --dart-define=API_URL=http://10.0.2.2:4000
class ApiConfig {
  const ApiConfig._();

  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:4000',
  );
}
