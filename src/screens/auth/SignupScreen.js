import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  Modal, 
  KeyboardAvoidingView, 
  useWindowDimensions 
} from 'react-native';
import { 
  User, 
  Mail, 
  Eye,
  EyeOff,
  Shield, 
  ShieldCheck, 
  X, 
  KeyRound, 
  CheckCircle2, 
  Send, 
  RefreshCw, 
  Copy, 
  Check 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import ScreenContainer from '../../components/ScreenContainer';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { 
  authenticateUser, 
  sendEmailVerificationCode, 
  verifyEmailVerificationCode 
} from '../../services/supabase';
import { signInWithGoogle } from '../../services/googleAuth';
import GoogleAuthModal from '../../components/GoogleAuthModal';

const SignupScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 720;
  const { user, role, signInWithGoogle: authSignInWithGoogle } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);

  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [userFocused, setUserFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);

  // Admin Modal State
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminEmail, setAdminEmail] = useState('prasanthm4734h@gmail.com');
  const [adminPassword, setAdminPassword] = useState('Gandharva.01.');
  const [adminShowPass, setAdminShowPass] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const routeUser = (role) => {
    try {
      if (role === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('Main');
      }
    } catch (e) {
      try {
        navigation.navigate(role === 'admin' ? 'AdminDashboard' : 'Main');
      } catch (err) {}
    }
  };

  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Missing Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendEmailVerificationCode(cleanEmail);
      setLoading(false);

      if (res.success) {
        setSentCode(res.code);
        setOtpSent(true);
        setCountdown(60);
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to dispatch verification code.');
    }
  };

  const handleVerifyOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      Alert.alert('Missing Code', 'Please enter the 6-digit verification code.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyEmailVerificationCode(cleanEmail, cleanOtp, username);
      setVerifying(false);

      if (res.success) {
        routeUser(res.role || (cleanEmail === 'prasanthm4734h@gmail.com' ? 'admin' : 'artist'));
      } else {
        Alert.alert('Verification Failed', res.error || 'Invalid OTP code.');
      }
    } catch (err) {
      setVerifying(false);
      Alert.alert('Error', err.message || 'Verification could not be completed.');
    }
  };

  const handleAutoFill = () => {
    if (!sentCode) return;
    setOtp(sentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoogleSignUp = async () => {
    try {
      const res = await signInWithGoogle();
      if (res?.requireModal) {
        setGoogleModalVisible(true);
      }
    } catch (err) {
      setGoogleModalVisible(true);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) {
      Alert.alert('Admin Access', 'Please enter administrator credentials.');
      return;
    }

    setAdminLoading(true);
    const result = await authenticateUser(adminEmail, adminPassword);
    setAdminLoading(false);

    if (result.success && result.role === 'admin') {
      setAdminModalVisible(false);
      navigation.replace('AdminDashboard');
    } else {
      Alert.alert('Admin Verification Failed', result.error || 'Invalid administrator credentials.');
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Neon Card Container */}
          <View style={[styles.card, isDesktop ? styles.cardDesktop : styles.cardMobile]}>
            
            {/* Background Slanted Graphic */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 800 500">
                <Defs>
                  <SvgLinearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#06222B" stopOpacity="1" />
                    <Stop offset="50%" stopColor="#0B404C" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#082A33" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                
                {/* Right Dark Black background */}
                <Polygon points="0,0 800,0 800,500 0,500" fill="#040608" />
                
                {/* Left Diagonal Teal Polygon strictly to the left */}
                <Polygon points="0,0 220,0 70,500 0,500" fill="url(#tealGrad)" />
                
                {/* Glowing Cyan Divider Line strictly to the left */}
                <Polygon points="218,0 222,0 72,500 68,500" fill="#00E5FF" opacity="0.95" />
              </Svg>
            </View>

            {/* Split Content */}
            <View style={[styles.contentRow, isDesktop ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>
              
              {/* Left "WELCOME!" Side */}
              <View style={[styles.leftSection, isDesktop ? styles.leftDesktop : styles.leftMobile]}>
                <Text style={styles.welcomeText}>WELCOME!</Text>
              </View>

              {/* Right "Register" Form Side */}
              <View style={[styles.rightSection, isDesktop ? styles.rightDesktop : styles.rightMobile]}>
                <Text style={styles.formTitle}>Register</Text>

                {/* Display Name Field */}
                <View style={styles.inputUnderlineBox}>
                  <TextInput
                    placeholder="Name"
                    placeholderTextColor="#8E9AA0"
                    style={styles.underlineInput}
                    value={username}
                    onChangeText={setUsername}
                    editable={!otpSent}
                    onFocus={() => setUserFocused(true)}
                    onBlur={() => setUserFocused(false)}
                  />
                  <User color={userFocused ? '#00E5FF' : '#A0AEC0'} size={18} />
                </View>
                <View style={[styles.underline, userFocused && styles.underlineActive]} />

                {/* Email Field */}
                <View style={[styles.inputUnderlineBox, { marginTop: 20 }]}>
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="#8E9AA0"
                    style={styles.underlineInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!otpSent}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                  <Mail color={emailFocused ? '#00E5FF' : '#A0AEC0'} size={18} />
                </View>
                <View style={[styles.underline, emailFocused && styles.underlineActive]} />

                {/* OTP Verification Section (Displays when OTP is Sent) */}
                {otpSent ? (
                  <View style={{ marginTop: 18 }}>
                    {/* Realtime Email Sent Notification Banner */}
                    <View style={styles.otpBanner}>
                      <Mail color="#00E5FF" size={20} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.otpBannerLabel}>Verification Code Sent!</Text>
                        <Text style={styles.otpBannerSub}>Check your email inbox ({email}) for your 6-digit code.</Text>
                      </View>
                    </View>

                    {/* OTP Input Field */}
                    <View style={styles.inputUnderlineBox}>
                      <TextInput
                        placeholder="Enter 6-Digit OTP"
                        placeholderTextColor="#8E9AA0"
                        style={[styles.underlineInput, { letterSpacing: 3, fontWeight: '700' }]}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                        onFocus={() => setOtpFocused(true)}
                        onBlur={() => setOtpFocused(false)}
                      />
                      <KeyRound color={otpFocused ? '#00E5FF' : '#A0AEC0'} size={18} />
                    </View>
                    <View style={[styles.underline, otpFocused && styles.underlineActive]} />

                    {/* Change Details / Resend Link */}
                    <View style={styles.otpHelperRow}>
                      <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(''); }}>
                        <Text style={styles.editLinkText}>Edit Email / Name</Text>
                      </TouchableOpacity>

                      {countdown > 0 ? (
                        <Text style={styles.countdownText}>Resend in {countdown}s</Text>
                      ) : (
                        <TouchableOpacity onPress={handleSendOtp} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <RefreshCw size={12} color="#00E5FF" />
                          <Text style={styles.resendLinkText}>Resend OTP</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Verify & Register Button */}
                    <TouchableOpacity 
                      style={styles.actionPillBtn} 
                      onPress={handleVerifyOtp}
                      disabled={verifying}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#00E5FF', '#0891B2', '#0E7490']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.pillGradient}
                      >
                        {verifying ? (
                          <ActivityIndicator color="#040608" size="small" />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <CheckCircle2 color="#040608" size={18} />
                            <Text style={[styles.actionBtnText, { color: '#040608', fontWeight: '800' }]}>
                              Verify & Register
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Send OTP Button (Initial State) */
                  <TouchableOpacity 
                    style={styles.actionPillBtn} 
                    onPress={handleSendOtp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#08363F', '#0E5563', '#116C7D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.pillGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Send color="#FFFFFF" size={16} />
                          <Text style={styles.actionBtnText}>Send OTP</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity 
                  style={styles.googleBtn} 
                  onPress={handleGoogleSignUp}
                  activeOpacity={0.85}
                >
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Switch Link */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchMuted}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.switchLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>

          </View>
        </ScrollView>



        {/* Discreet Bottom-Right Admin Icon Button */}
        <TouchableOpacity
          style={styles.adminFloatingBtn}
          onPress={() => setAdminModalVisible(true)}
          activeOpacity={0.75}
          accessibilityLabel="Admin Portal"
        >
          <View style={styles.adminFloatingInner}>
            <Shield color="#00E5FF" size={18} strokeWidth={2.2} />
          </View>
        </TouchableOpacity>

        {/* Google Auth Account Chooser Modal */}
        <GoogleAuthModal
          visible={googleModalVisible}
          onClose={() => setGoogleModalVisible(false)}
          onSuccess={async (role, googleUser) => {
            if (authSignInWithGoogle) {
              await authSignInWithGoogle(googleUser, role);
            }
            routeUser(role || 'artist');
          }}
        />

        {/* Admin Login Dialog Modal */}
        <Modal
          visible={adminModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAdminModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.adminModalCard}>
              <View style={styles.adminModalHeader}>
                <View style={styles.adminBadgeRow}>
                  <View style={styles.adminIconBox}>
                    <ShieldCheck color="#00E5FF" size={22} />
                  </View>
                  <View>
                    <Text style={styles.adminModalTitle}>Studio Director</Text>
                    <Text style={styles.adminModalSubtitle}>Restricted Admin Portal</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setAdminModalVisible(false)}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X color="#9CA3AF" size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Admin Email</Text>
                <View style={styles.modalInputWrapper}>
                  <Mail color="#00E5FF" size={18} />
                  <TextInput
                    placeholder="admin@gandharva.com"
                    placeholderTextColor="#6B7280"
                    style={styles.modalInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={adminEmail}
                    onChangeText={setAdminEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Master Password</Text>
                <View style={styles.modalInputWrapper}>
                  <KeyRound color="#00E5FF" size={18} />
                  <TextInput
                    placeholder="Master Password"
                    placeholderTextColor="#6B7280"
                    style={styles.modalInput}
                    secureTextEntry={!adminShowPass}
                    value={adminPassword}
                    onChangeText={setAdminPassword}
                  />
                  <TouchableOpacity onPress={() => setAdminShowPass(!adminShowPass)} style={{ padding: 4 }}>
                    {adminShowPass ? <EyeOff color="#9CA3AF" size={18} /> : <Eye color="#6B7280" size={18} />}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.quickFillBtn}
                onPress={() => {
                  setAdminEmail('prasanthm4734h@gmail.com');
                  setAdminPassword('Gandharva.01.');
                }}
              >
                <CheckCircle2 color="#00E5FF" size={14} />
                <Text style={styles.quickFillText}>Quick-fill Registered Admin Credentials</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleAdminLogin}
                disabled={adminLoading}
                activeOpacity={0.88}
                style={styles.adminSubmitBtn}
              >
                <LinearGradient
                  colors={['#08363F', '#0E5563', '#00E5FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.adminSubmitGradient}
                >
                  {adminLoading ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    <Text style={styles.adminSubmitText}>Access Admin Dashboard 👑</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020406',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 780,
    borderRadius: 16,
    borderWidth: 1.6,
    borderColor: '#00E5FF',
    backgroundColor: '#040608',
    overflow: 'hidden',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 12,
  },
  cardDesktop: {
    minHeight: 460,
  },
  cardMobile: {
    minHeight: 540,
  },
  contentRow: {
    flex: 1,
  },
  leftSection: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  leftDesktop: {
    width: '22%',
    paddingHorizontal: 8,
  },
  leftMobile: {
    width: '100%',
    paddingVertical: 36,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 229, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  rightSection: {
    justifyContent: 'center',
    paddingLeft: 45,
    paddingRight: 40,
    paddingVertical: 36,
  },
  rightDesktop: {
    width: '78%',
  },
  rightMobile: {
    width: '100%',
    paddingTop: 10,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputUnderlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  underlineInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 6,
    paddingRight: 10,
    outlineStyle: 'none',
  },
  underline: {
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  underlineActive: {
    backgroundColor: '#00E5FF',
    height: 1.8,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  otpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  otpBannerLabel: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '700',
  },
  otpBannerSub: {
    color: '#D1D5DB',
    fontSize: 11,
    marginTop: 2,
  },
  otpFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  otpFillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  otpHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  editLinkText: {
    color: '#8E9AA0',
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  countdownText: {
    color: '#8E9AA0',
    fontSize: 11,
    fontWeight: '500',
  },
  resendLinkText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionPillBtn: {
    marginTop: 24,
    borderRadius: 25,
    borderWidth: 1.4,
    borderColor: '#00E5FF',
    overflow: 'hidden',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  pillGradient: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 11,
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleBtn: {
    width: '100%',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  googleBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  switchMuted: {
    color: '#94A3B8',
    fontSize: 12,
  },
  switchLink: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Floating Admin Button (Bottom-Right)
  adminFloatingBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
  adminFloatingInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(4, 18, 24, 0.9)',
    borderWidth: 1.2,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },

  // Admin Modal Dialog
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  adminModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#070D12',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    padding: SPACING.lg,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  adminModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  adminModalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  modalLabel: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  modalInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: SPACING.sm,
  },
  quickFillText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '600',
  },
  adminSubmitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
  },
  adminSubmitGradient: {
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminSubmitText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default SignupScreen;



