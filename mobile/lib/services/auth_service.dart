import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'token_storage.dart';

class AuthException implements Exception {
  AuthException(this.message);
  final String message;
  @override
  String toString() => message;
}

class SessionUser {
  SessionUser({required this.id, required this.email, required this.role});

  factory SessionUser.fromJson(Map<String, dynamic> json) => SessionUser(
        id: json['id'] as String? ?? json['sub'] as String? ?? '',
        email: json['email'] as String? ?? '',
        role: json['role'] as String? ?? 'user',
      );

  final String id;
  final String email;
  final String role;
}

/// Auth client with access/refresh token rotation.
///
/// On a 401 the request is retried once after rotating tokens against
/// `POST /api/auth/refresh`. The refresh token is sent in the JSON body
/// (native apps can't rely on httpOnly cookies like the web client).
class AuthService {
  AuthService({TokenStorage? storage, http.Client? httpClient})
      : _storage = storage ?? TokenStorage(),
        _http = httpClient ?? http.Client();

  final TokenStorage _storage;
  final http.Client _http;

  Uri _uri(String path) => Uri.parse('${ApiConfig.apiUrl}$path');

  Future<SessionUser> register(String email, String password) =>
      _authenticate('/api/auth/register', email, password);

  Future<SessionUser> login(String email, String password) =>
      _authenticate('/api/auth/login', email, password);

  Future<SessionUser> _authenticate(
    String path,
    String email,
    String password,
  ) async {
    final response = await _http.post(
      _uri(path),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final body = _decode(response);
    if (response.statusCode >= 400) {
      throw AuthException(body['error'] as String? ?? 'Authentication failed');
    }
    await _storage.save(
      accessToken: body['accessToken'] as String,
      refreshToken: body['refreshToken'] as String,
    );
    return SessionUser.fromJson(body['user'] as Map<String, dynamic>);
  }

  /// Authenticated GET. Transparently rotates tokens on a 401.
  Future<Map<String, dynamic>> getJson(String path) async {
    var response = await _http.get(_uri(path), headers: await _authHeaders());
    if (response.statusCode == 401 && await _rotate()) {
      response = await _http.get(_uri(path), headers: await _authHeaders());
    }
    final body = _decode(response);
    if (response.statusCode >= 400) {
      throw AuthException(body['error'] as String? ?? 'Request failed');
    }
    return body;
  }

  Future<bool> _rotate() async {
    final refreshToken = await _storage.refreshToken;
    if (refreshToken == null) return false;

    final response = await _http.post(
      _uri('/api/auth/refresh'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'refreshToken': refreshToken}),
    );
    if (response.statusCode >= 400) {
      await _storage.clear();
      return false;
    }
    final body = _decode(response);
    await _storage.save(
      accessToken: body['accessToken'] as String,
      refreshToken: body['refreshToken'] as String,
    );
    return true;
  }

  Future<void> logout() async {
    final refreshToken = await _storage.refreshToken;
    if (refreshToken != null) {
      await _http.post(
        _uri('/api/auth/logout'),
        headers: const {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );
    }
    await _storage.clear();
  }

  Future<bool> get isLoggedIn async => (await _storage.accessToken) != null;

  Future<Map<String, String>> _authHeaders() async {
    final accessToken = await _storage.accessToken;
    return {
      'Content-Type': 'application/json',
      if (accessToken != null) 'Authorization': 'Bearer $accessToken',
    };
  }

  Map<String, dynamic> _decode(http.Response response) {
    if (response.body.isEmpty) return {};
    final decoded = jsonDecode(response.body);
    return decoded is Map<String, dynamic> ? decoded : {};
  }
}
