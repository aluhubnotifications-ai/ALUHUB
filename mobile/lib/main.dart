import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'services/auth_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Color(0xFF071830),
    statusBarIconBrightness: Brightness.light,
    navigationBarColor: Color(0xFF071830),
  ));
  runApp(const AluHubApp());
}

// ── Design tokens (mirrors web CSS variables) ──────────────────────────────
class AppColors {
  static const navy = Color(0xFF0B2447);
  static const navy2 = Color(0xFF071830);
  static const navy3 = Color(0xFF163566);
  static const navyLight = Color(0xFF1a4a8a);
  static const blue = Color(0xFF2563EB);
  static const blueLight = Color(0xFF60a5fa);
  static const accent2 = Color(0xFF7eb3f8);
  static const warm = Color(0xFFE66000);
  static const success = Color(0xFF059669);
  static const danger = Color(0xFFDC2626);

  static const bg = Color(0xFFF4F7FB);
  static const bg2 = Color(0xFFFFFFFF);
  static const bg3 = Color(0xFFF1F4F9);
  static const bg4 = Color(0xFFE8EDF5);

  static const border = Color(0xFFE2E8F0);
  static const border2 = Color(0xFFC4CEDE);

  static const text = Color(0xFF0F172A);
  static const text2 = Color(0xFF475569);
  static const text3 = Color(0xFF94A3B8);
}

class AluHubApp extends StatelessWidget {
  const AluHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ALU Hub',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: AppColors.navy,
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.bg,
        fontFamily: 'sans-serif',
      ),
      home: const LoginScreen(),
    );
  }
}

// ── Login Screen ────────────────────────────────────────────────────────────
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _auth = AuthService();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;
  bool _registerMode = false;
  bool _obscurePassword = true;

  Future<void> _submit() async {
    final email = _email.text.trim();
    final pass = _password.text;
    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Please fill in all fields.');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      final user = _registerMode
          ? await _auth.register(email, pass)
          : await _auth.login(email, pass);
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => HomeScreen(user: user)),
        );
      }
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not reach the server. Please try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          // Top gradient accent bar (4px, matching web)
          Container(
            height: 4,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.navy, AppColors.blue, AppColors.blueLight]),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header hero (navy gradient, matching web auth-left)
                  _buildHeader(),
                  // Form section
                  _buildForm(),
                  // Feature cards
                  _buildFeatures(),
                  // Secure footer
                  _buildFooter(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(28, 36, 28, 40),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0e2d5c), Color(0xFF163566), Color(0xFF0e2d5c)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 7, height: 7,
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 7),
                const Text(
                  'ALU & CMU-Africa Platform',
                  style: TextStyle(color: Color(0xCCFFFFFF), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.6),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          // Logo
          Row(
            children: [
              Container(
                width: 42, height: 42,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1a4a80), AppColors.navy],
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [BoxShadow(color: AppColors.navy.withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 4))],
                ),
                child: const Center(child: Text('A', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800))),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('ALU', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
                  Text('Hub', style: TextStyle(color: AppColors.accent2, fontSize: 13, letterSpacing: 1.5)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 22),
          // Eyebrow
          Text(
            'STUDENT PORTAL',
            style: TextStyle(color: AppColors.warm.withOpacity(0.9), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5),
          ),
          const SizedBox(height: 8),
          // Heading
          Text(
            _registerMode ? 'Create account' : 'Welcome back',
            style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.8, height: 1.15),
          ),
          const SizedBox(height: 6),
          Text(
            _registerMode
                ? 'Join ALU Hub to access internships, companies, housing, skills, and resources.'
                : 'Sign in to your ALU Hub account to access internships, housing, skills, and more.',
            style: const TextStyle(color: Color(0x99FFFFFF), fontSize: 13, height: 1.65),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Container(
      color: AppColors.bg2,
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Email
          _fieldLabel('EMAIL'),
          const SizedBox(height: 6),
          _inputField(
            controller: _email,
            hint: 'Email address',
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          // Password
          _fieldLabel('PASSWORD'),
          const SizedBox(height: 6),
          _inputField(
            controller: _password,
            hint: 'Password',
            obscure: _obscurePassword,
            textInputAction: TextInputAction.done,
            onSubmit: (_) => _submit(),
            suffix: IconButton(
              icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18, color: AppColors.text3),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
          // Error
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 12.5, fontWeight: FontWeight.w600)),
          ],
          const SizedBox(height: 20),
          // Primary button
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: _busy ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.navy.withOpacity(0.4),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: EdgeInsets.zero,
              ).copyWith(
                backgroundColor: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.disabled)) return AppColors.navy.withOpacity(0.4);
                  return Colors.transparent;
                }),
              ),
              child: Ink(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1a4a8a), AppColors.navy],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Container(
                  alignment: Alignment.center,
                  child: _busy
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                      : Text(
                          _registerMode ? 'Create Account' : 'Sign In',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 0.3),
                        ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Divider
          Row(children: [
            const Expanded(child: Divider(color: AppColors.border)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text('or', style: TextStyle(color: AppColors.text3, fontSize: 12)),
            ),
            const Expanded(child: Divider(color: AppColors.border)),
          ]),
          const SizedBox(height: 12),
          // Switch mode
          TextButton(
            onPressed: _busy ? null : () => setState(() { _registerMode = !_registerMode; _error = null; }),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.navy,
              textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
            child: Text(_registerMode ? "Already have an account?  Sign in" : "Don't have an account?  Create one"),
          ),
        ],
      ),
    );
  }

  Widget _fieldLabel(String text) => Text(
    text,
    style: const TextStyle(color: AppColors.text2, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.6),
  );

  Widget _inputField({
    required TextEditingController controller,
    required String hint,
    bool obscure = false,
    TextInputType keyboardType = TextInputType.text,
    TextInputAction textInputAction = TextInputAction.next,
    ValueChanged<String>? onSubmit,
    Widget? suffix,
  }) {
    return Container(
      height: 50,
      decoration: BoxDecoration(
        color: AppColors.bg3,
        border: Border.all(color: AppColors.border, width: 1.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboardType,
        textInputAction: textInputAction,
        onSubmitted: onSubmit,
        style: const TextStyle(color: AppColors.text, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppColors.text3),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 14),
          suffixIcon: suffix,
        ),
      ),
    );
  }

  Widget _buildFeatures() {
    final features = [
      ('💼', 'Internships & Jobs', 'Find internships and jobs at top companies'),
      ('🏠', 'Housing Listings', 'Discover housing listings from peers'),
      ('📚', 'Skills & Resources', 'Learn from expert peer tutors'),
    ];
    return Container(
      color: AppColors.bg,
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Platform Features', style: TextStyle(color: AppColors.text3, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2)),
          const SizedBox(height: 12),
          for (final f in features)
            Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.bg2,
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.bg3,
                      border: Border.all(color: AppColors.border),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(child: Text(f.$1, style: const TextStyle(fontSize: 18))),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(f.$2, style: const TextStyle(color: AppColors.text, fontSize: 13.5, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 2),
                        Text(f.$3, style: const TextStyle(color: AppColors.text2, fontSize: 12.5, height: 1.4)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      color: AppColors.bg,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.lock_outline, size: 14, color: AppColors.text3),
          SizedBox(width: 6),
          Text('Secured by ALU Hub', style: TextStyle(color: AppColors.text3, fontSize: 12)),
        ],
      ),
    );
  }
}

// ── Home / Dashboard Screen ─────────────────────────────────────────────────
class HomeScreen extends StatelessWidget {
  final SessionUser user;
  const HomeScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    final name = user.email.contains('@')
        ? _capitalize(user.email.split('@').first)
        : _capitalize(user.email);

    final sections = [
      ('💼', 'Jobs', 'Browse internships'),
      ('🏠', 'Housing', 'Find a place to stay'),
      ('📚', 'Skills', 'Learn from peers'),
      ('🎯', 'Resources', 'Guides & tools'),
    ];

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          // Top bar
          Container(
            color: AppColors.navy,
            padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
            child: Container(
              height: 60,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  // Logo
                  Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft, end: Alignment.bottomRight,
                        colors: [Color(0xFF1a4a80), AppColors.navy],
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(child: Text('A', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800))),
                  ),
                  const SizedBox(width: 9),
                  const Text('ALU', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800)),
                  Text('Hub', style: TextStyle(color: AppColors.accent2, fontSize: 16, fontWeight: FontWeight.w800)),
                  const Spacer(),
                  // Logout
                  OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white.withOpacity(0.85),
                      side: BorderSide(color: Colors.white.withOpacity(0.2)),
                      backgroundColor: Colors.white.withOpacity(0.1),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Log out', style: TextStyle(fontSize: 13)),
                  ),
                ],
              ),
            ),
          ),
          // Content
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Welcome hero
                  Container(
                    padding: const EdgeInsets.fromLTRB(24, 28, 24, 36),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft, end: Alignment.bottomRight,
                        colors: [Color(0xFF0e2d5c), Color(0xFF163566), Color(0xFF0e2d5c)],
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('WELCOME BACK', style: TextStyle(color: AppColors.accent2.withOpacity(0.85), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
                        const SizedBox(height: 8),
                        Text('Hello, $name!', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
                        const SizedBox(height: 6),
                        const Text(
                          'Your all-in-one platform for internships, housing, skills, and resources.',
                          style: TextStyle(color: Color(0x99FFFFFF), fontSize: 13, height: 1.65),
                        ),
                      ],
                    ),
                  ),
                  // Quick access grid
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Quick Access', style: TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
                        const SizedBox(height: 14),
                        GridView.count(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          childAspectRatio: 1.3,
                          children: sections.map((s) => _dashCard(s.$1, s.$2, s.$3)).toList(),
                        ),
                        const SizedBox(height: 12),
                        // Companies card (full width)
                        _featuredCard(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dashCard(String emoji, String title, String sub) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bg2,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 26)),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(color: AppColors.text, fontSize: 14, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(sub, style: const TextStyle(color: AppColors.text2, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _featuredCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.bg2,
        border: Border.all(color: AppColors.navy.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          const Text('🏢', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Companies', style: TextStyle(color: AppColors.text, fontSize: 15, fontWeight: FontWeight.w700)),
                SizedBox(height: 3),
                Text('Explore companies hiring ALU & CMU-Africa students', style: TextStyle(color: AppColors.text2, fontSize: 12, height: 1.4)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.text3, size: 22),
        ],
      ),
    );
  }

  String _capitalize(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}
