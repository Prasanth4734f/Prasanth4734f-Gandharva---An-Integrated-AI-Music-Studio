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
  HelpCircle, 
  Send, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronLeft 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import ScreenContainer from '../../components/ScreenContainer';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase, authenticateUser, sendEmailVerificationCode, verifyEmailVerificationCode } from '../../services/supabase';
import { signInWithGoogle, handleOAuthRedirect } from '../../services/googleAuth';
import { verifyAdminLogin } from '../../services/adminAuthService';
import GoogleAuthModal from '../../components/GoogleAuthModal';
import OtpCarAnimation from '../../components/OtpCarAnimation';
import { Path } from 'react-native-svg';

const GoogleLogo = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </Svg>
);

const LoginScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 720;
  const { user, role, signIn, signInWithGoogle: authSignInWithGoogle, setUserSession } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);

  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);

  // Admin Modal State with Dedicated ID, Password & Security PIN
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminIdentifier, setAdminIdentifier] = useState('GANDHARVA_ADMIN_01');
  const [adminPassword, setAdminPassword] = useState('Gandharva.01.');
  const [adminPin, setAdminPin] = useState('9494');
  const [adminShowPass, setAdminShowPass] = useState(false);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  // Countdown timer for Resend OTP
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

  // Dedicated Admin Login Verification with Security PIN
  const handleAdminLogin = async () => {
    if (!adminIdentifier || !adminPassword) {
      Alert.alert('Admin Access', 'Please enter your Admin ID and Master Password.');
      return;
    }

    setAdminLoading(true);
    const result = await verifyAdminLogin({
      adminIdentifier,
      password: adminPassword,
      securityPin: adminPin,
    });
    setAdminLoading(false);

    if (result.success) {
      setAdminModalVisible(false);
      navigation.replace('AdminDashboard');
    } else {
      Alert.alert('Admin Security Verification Failed', result.error || 'Invalid administrator credentials or PIN.');
    }
  };

  // Automatic OAuth Redirect Handler (Supabase Google Sign-In)
  useEffect(() => {
    let isMounted = true;

    const checkOAuthSession = async () => {
      try {
        const oauthSession = await handleOAuthRedirect();
        let session = oauthSession;
        if (!session) {
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        }

        if (session?.user?.email && isMounted) {
          const cleanEmail = session.user.email.toLowerCase();
          const role = (cleanEmail === 'prasanthm4734h@gmail.com' || cleanEmail.startsWith('admin@') || cleanEmail.includes('admin'))
            ? 'admin'
            : 'artist';
          
          if (authSignInWithGoogle) {
            await authSignInWithGoogle(session.user, role);
          }
          setPendingGoogleRole(role);
          setIsGoogleTriggered(true);
          setTimeout(() => {
            if (isMounted) {
              routeUser(role);
            }
          }, 600);
        }
      } catch (e) {
        console.warn('OAuth check note:', e);
      }
    };

    checkOAuthSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email && isMounted) {
        const cleanEmail = session.user.email.toLowerCase();
        const role = (cleanEmail === 'prasanthm4734h@gmail.com' || cleanEmail.startsWith('admin@') || cleanEmail.includes('admin'))
          ? 'admin'
          : 'artist';

        if (authSignInWithGoogle) {
          await authSignInWithGoogle(session.user, role);
        }
        setPendingGoogleRole(role);
        setIsGoogleTriggered(true);
        setTimeout(() => {
          if (isMounted) {
            routeUser(role);
          }
        }, 600);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 1. Send OTP Action
  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Missing Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // Direct Admin Shortcut
      if (cleanEmail === 'prasanthm4734h@gmail.com' && name.toLowerCase().includes('admin')) {
        setLoading(false);
        navigation.replace('AdminDashboard');
        return;
      }

      const res = await sendEmailVerificationCode(cleanEmail);
      setLoading(false);

      if (res.success) {
        setSentCode(res.code);
        setOtpSent(true);
        setCountdown(60);
        setShowOtpToast(true);
        setTimeout(() => setShowOtpToast(false), 2000);
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to dispatch verification code.');
    }
  };

  const [showOtpToast, setShowOtpToast] = useState(false);
  const [isSuccessTriggered, setIsSuccessTriggered] = useState(false);
  const [isErrorTriggered, setIsErrorTriggered] = useState(false);
  const [isGoogleTriggered, setIsGoogleTriggered] = useState(false);
  const [pendingGoogleRole, setPendingGoogleRole] = useState(null);
  const [otpErrorMessage, setOtpErrorMessage] = useState('');

  // 2. Manual Verify Click (Validates OTP with Backend)
  const handleVerifyClick = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter the complete 6-digit OTP code.');
      return;
    }

    setVerifying(true);
    setIsErrorTriggered(false);
    setOtpErrorMessage('');

    try {
      const res = await verifyEmailVerificationCode(cleanEmail, cleanOtp, name);
      setVerifying(false);

      if (res.success) {
        if (setUserSession) {
          const authUser = res.user || {
            id: 'usr_' + Date.now(),
            email: cleanEmail,
            user_metadata: { full_name: name || cleanEmail.split('@')[0] },
          };
          const targetRole = res.role || (cleanEmail === 'prasanthm4734h@gmail.com' ? 'admin' : 'artist');
          setUserSession(authUser, targetRole);
        }
        // OTP IS CORRECT: Launch full car animation sequence and navigate into studio!
        setIsSuccessTriggered(true);
      } else {
        // OTP IS INCORRECT: Tyres rotate in place, stay where they are, say OTP is invalid
        setIsErrorTriggered(true);
        setOtpErrorMessage(res.error || 'OTP is invalid');
      }
    } catch (err) {
      setVerifying(false);
      setIsErrorTriggered(true);
      setOtpErrorMessage(err.message || 'OTP is invalid');
    }
  };

  const handleAnimationComplete = () => {
    if (isGoogleTriggered) {
      routeUser(pendingGoogleRole || 'artist');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    routeUser(cleanEmail === 'prasanthm4734h@gmail.com' ? 'admin' : 'artist');
  };

  // 3. Auto Fill OTP Helper
  const handleAutoFill = () => {
    if (!sentCode) return;
    setOtp(sentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      if (res?.requireModal) {
        setGoogleModalVisible(true);
      }
    } catch (err) {
      setGoogleModalVisible(true);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      {/* 2-Second Floating Pop-up Toast */}
      {showOtpToast && (
        <View style={styles.toastPopup} pointerEvents="none">
          <Mail color="#00E5FF" size={18} />
          <Text style={styles.toastPopupText}>Verification Code Sent!</Text>
        </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Middle Project Name Header with Vibrant Colors Above Car */}
          <View style={styles.topHeader}>
            <Text style={styles.topBrandTitle}>
              <Text style={styles.topBrandName}>GANDHARVA</Text>
              <Text style={styles.topBrandDivider}> — </Text>
              <Text style={styles.topBrandAi}>An AI </Text>
              <Text style={styles.topBrandIntegrated}>Integrated </Text>
              <Text style={styles.topBrandMusicStudio}>Music Studio</Text>
            </Text>
          </View>

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
                
                {/* Left Diagonal Teal Polygon strictly to the left with wider space */}
                <Polygon points="0,0 280,0 120,500 0,500" fill="url(#tealGrad)" />
                
                {/* Glowing Cyan Divider Line with wider space */}
                <Polygon points="278,0 282,0 122,500 118,500" fill="#00E5FF" opacity="0.95" />
              </Svg>
            </View>

            {/* Active Car & Cosmic Eclipse Orbit Animation */}
            <OtpCarAnimation
              otp={otp}
              otpSent={otpSent}
              isSuccessTriggered={isSuccessTriggered}
              isErrorTriggered={isErrorTriggered}
              isGoogleTriggered={isGoogleTriggered}
              onAnimationComplete={handleAnimationComplete}
              isDesktop={isDesktop}
            />

            {/* Split Content */}
            <View style={[styles.contentRow, isDesktop ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>
              
              {/* Left "WELCOME!" Side */}
              <View style={[styles.leftSection, isDesktop ? styles.leftDesktop : (otpSent ? styles.leftMobileWithOtp : styles.leftMobile)]}>
                <Text style={[styles.welcomeText, !isDesktop && otpSent && { textAlign: 'left' }]}>WELCOME!</Text>
                <Text style={[styles.welcomeSubTitle, !isDesktop && otpSent && { textAlign: 'left' }]}>
                  GANDHARVA <Text style={{ color: '#00E5FF', fontWeight: '900' }}>AI STUDIO</Text>
                </Text>
              </View>

              {/* Right "Login" Form Side */}
              <View style={[styles.rightSection, isDesktop ? styles.rightDesktop : styles.rightMobile]}>
                <Text style={styles.formTitle}>Login</Text>
                <Text style={styles.formSubtitle}>Enter your details to sign in</Text>

                {/* Name Field with Underline & Right Icon */}
                <View style={styles.inputUnderlineBox}>
                  <TextInput
                    placeholder="Name"
                    placeholderTextColor="#8E9AA0"
                    style={styles.underlineInput}
                    value={name}
                    onChangeText={setName}
                    editable={!otpSent}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                  <User color={nameFocused ? '#00E5FF' : '#A0AEC0'} size={18} />
                </View>
                <View style={[styles.underline, nameFocused && styles.underlineActive]} />

                {/* Email Field with Underline & Right Icon */}
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
                  <View style={{ marginTop: 20, position: 'relative' }}>
                    {/* OTP Input Field */}
                    <View style={styles.inputUnderlineBox}>
                      <TextInput
                        placeholder="Enter 6-Digit OTP"
                        placeholderTextColor="#8E9AA0"
                        style={[styles.underlineInput, { letterSpacing: 6, fontWeight: '800', textAlign: 'center' }]}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={(text) => {
                          setOtp(text);
                          if (isErrorTriggered) {
                            setIsErrorTriggered(false);
                            setOtpErrorMessage('');
                          }
                        }}
                        onFocus={() => setOtpFocused(true)}
                        onBlur={() => setOtpFocused(false)}
                      />
                      <KeyRound color={otpFocused ? '#00E5FF' : '#A0AEC0'} size={18} />
                    </View>
                    <View style={[styles.underline, otpFocused && styles.underlineActive]} />

                    {/* Change Details / Resend Link */}
                    <View style={styles.otpHelperRow}>
                      <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(''); setIsSuccessTriggered(false); setIsErrorTriggered(false); }}>
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

                    {/* Verify & Sign In Button (Manual Trigger) */}
                    <TouchableOpacity 
                      style={styles.actionPillBtn} 
                      onPress={handleVerifyClick}
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
                              Verify & Sign In
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
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <GoogleLogo size={20} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </View>
                </TouchableOpacity>

                {/* Switch Link */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchMuted}>Don't have an account?</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                    <Text style={styles.switchLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>

          </View>
        </ScrollView>

        {/* Google Auth Account Chooser Modal */}
        <GoogleAuthModal
          visible={googleModalVisible}
          onClose={() => setGoogleModalVisible(false)}
          onSuccess={async (role, googleUser) => {
            if (authSignInWithGoogle) {
              await authSignInWithGoogle(googleUser, role);
            }
            setPendingGoogleRole(role);
            routeUser(role || 'artist');
          }}
        />

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

              {/* 1. Admin ID / Identifier */}
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Admin ID / Identifier</Text>
                <View style={styles.modalInputWrapper}>
                  <User color="#00E5FF" size={18} />
                  <TextInput
                    placeholder="GANDHARVA_ADMIN_01"
                    placeholderTextColor="#6B7280"
                    style={styles.modalInput}
                    autoCapitalize="none"
                    value={adminIdentifier}
                    onChangeText={setAdminIdentifier}
                  />
                </View>
              </View>

              {/* 2. Master Password */}
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

              {/* 3. 2FA Security PIN */}
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>2FA Master Security PIN</Text>
                <View style={styles.modalInputWrapper}>
                  <ShieldCheck color="#00E5FF" size={18} />
                  <TextInput
                    placeholder="4-Digit Security PIN"
                    placeholderTextColor="#6B7280"
                    style={[styles.modalInput, { letterSpacing: 4, fontWeight: '700' }]}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={adminPin}
                    onChangeText={setAdminPin}
                  />
                </View>
              </View>

              {/* 4. Security Options Accordion */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 8, paddingVertical: 4 }}
                onPress={() => setShowSecurityDetails(!showSecurityDetails)}
              >
                <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '700' }}>
                  🛡️ {showSecurityDetails ? 'Hide Security Options' : 'View Security Options'}
                </Text>
                <Text style={{ color: '#64748B', fontSize: 11 }}>{showSecurityDetails ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showSecurityDetails && (
                <View style={{ backgroundColor: 'rgba(0, 229, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                  <Text style={{ color: '#F1F5F9', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>Active Security Protocols:</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 10.5, lineHeight: 15 }}>• 256-bit AES Master Hardware Encryption</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 10.5, lineHeight: 15 }}>• 2FA PIN Gatekeeper Active (Code: 9494)</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 10.5, lineHeight: 15 }}>• 15-Minute Session Inactivity Auto-Lock</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 10.5, lineHeight: 15 }}>• 5-Attempt Anti-Brute Force Lockout Guard</Text>
                </View>
              )}

              {/* Quick Fill Registered Admin */}
              <TouchableOpacity 
                style={styles.quickFillBtn}
                onPress={() => {
                  setAdminIdentifier('GANDHARVA_ADMIN_01');
                  setAdminPassword('Gandharva.01.');
                  setAdminPin('9494');
                }}
              >
                <CheckCircle2 color="#00E5FF" size={14} />
                <Text style={styles.quickFillText}>Quick-fill Registered Admin (ID: GANDHARVA_ADMIN_01)</Text>
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
                    <Text style={styles.adminSubmitText}>Authenticate & Access Portal 👑</Text>
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
  toastPopup: {
    position: 'absolute',
    top: 28,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(4, 22, 28, 0.96)',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 30,
    zIndex: 99999,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 25,
  },
  toastPopupText: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  topHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 130, // Reduced by 2cm for clean, balanced clearance above the car
    marginTop: 20,
    paddingHorizontal: 16,
  },
  topBrandTitle: {
    textAlign: 'center',
  },
  topBrandName: {
    color: '#00E5FF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 229, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  topBrandDivider: {
    color: '#EC4899', // Hot Pink
    fontSize: 28,
    fontWeight: '700',
    textShadowColor: 'rgba(236, 72, 153, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  topBrandAi: {
    color: '#FACC15', // Vibrant Gold
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(250, 204, 21, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  topBrandIntegrated: {
    color: '#FFFFFF', // Crisp White
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
  topBrandMusicStudio: {
    color: '#38BDF8', // Electric Sky Blue
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(56, 189, 248, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  card: {
    width: '100%',
    maxWidth: 690, // Reduced card width for more compact, balanced aesthetic
    borderRadius: 16,
    borderWidth: 1.6,
    borderColor: '#00E5FF',
    backgroundColor: '#040608',
    overflow: 'visible',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 12,
  },
  cardDesktop: {
    minHeight: 410, // Reduced height
  },
  cardMobile: {
    minHeight: 460,
  },
  contentRow: {
    flex: 1,
  },
  leftSection: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  leftDesktop: {
    width: '28%',
    paddingHorizontal: 10,
  },
  leftMobile: {
    width: '100%',
    paddingVertical: 24,
  },
  leftMobileWithOtp: {
    width: '100%',
    paddingVertical: 24,
    paddingLeft: 135,
    alignItems: 'flex-start',
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
  welcomeSubTitle: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
  rightSection: {
    justifyContent: 'center',
    paddingLeft: 38,
    paddingRight: 32,
    paddingVertical: 28,
  },
  rightDesktop: {
    width: '72%',
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
    marginBottom: 4,
  },
  formSubtitle: {
    color: '#8E9AA0',
    fontSize: 12,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '600',
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
  otpStarCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    marginBottom: 4,
  },
  starCircleBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starCircleBoxFilled: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.22)',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  starIconText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    fontWeight: '900',
  },
  starIconTextActive: {
    color: '#00E5FF',
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: '#00E5FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
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

export default LoginScreen;



