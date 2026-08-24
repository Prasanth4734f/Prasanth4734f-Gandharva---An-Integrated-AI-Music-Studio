import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing, 
  Image,
  Platform
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MUSTANG_CHASSIS = require('../../assets/mustang_exact_wireframe_chassis.png');
const MUSTANG_WHEEL = require('../../assets/mustang_clean_wheel.png');

/**
 * Spinning Wheel Component
 */
const RealisticSpinningWheel = ({ size = 36, isSpinning = false, spinSpeed = 150 }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop = null;
    if (isSpinning) {
      loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: spinSpeed,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
      loop.start();
    } else {
      spinAnim.setValue(0);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [isSpinning, spinSpeed]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate: spin }] }}>
      <Image
        source={MUSTANG_WHEEL}
        style={{ width: size, height: size, resizeMode: 'contain' }}
      />
    </Animated.View>
  );
};

/**
 * Single Tyre with Anticlockwise Blue / Red Stroke
 */
const AnticlockwiseTyreItem = ({ isEntered, isError = false, isSpinning = false, size = 52 }) => {
  const strokeAnim = useRef(new Animated.Value(isEntered ? 1 : 0)).current;

  useEffect(() => {
    if (isEntered) {
      Animated.timing(strokeAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(strokeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isEntered]);

  const radius = (size / 2) - 3;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = strokeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const strokeColor = isError ? '#EF4444' : '#00E5FF';

  return (
    <View style={[styles.tyreWrapper, { width: size, height: size }]}>
      <Svg 
        width={size} 
        height={size} 
        style={[StyleSheet.absoluteFillObject, { transform: [{ scaleX: -1 }, { rotate: '-90deg' }] }]}
      >
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.4}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      <RealisticSpinningWheel size={size > 36 ? size - 14 : size - 6} isSpinning={isSpinning} spinSpeed={isError ? 120 : 150} />
    </View>
  );
};

/**
 * Animated Floating Colorful Music Symbol Emerging from Silencer Exhaust
 */
const FloatingMusicSymbol = ({ symbol, color = '#00E5FF', delay = 0, startX = 0, startY = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: Platform.OS !== 'web',
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [startY, startY - 30, startY - 70],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [startX, startX - 45, startX - 100],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.15, 0.8, 1],
    outputRange: [0, 1, 0.95, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.7, 1.5, 0.9],
  });

  return (
    <Animated.Text
      style={[
        styles.musicSymbolText,
        {
          color,
          textShadowColor: color,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    >
      {symbol}
    </Animated.Text>
  );
};

/**
 * Explosive Musical Smoke Particle
 */
const ExplodingMusicParticle = ({ symbol, color, angle, distance, size = 26 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  const rad = (angle * Math.PI) / 180;
  const targetX = Math.cos(rad) * distance;
  const targetY = Math.sin(rad) * distance;

  const translateX = anim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, targetX * 0.4, targetX],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, targetY * 0.4, targetY],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.15, 0.6, 1],
    outputRange: [0.2, 2.2, 1.4, 0],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [0, 1, 0.85, 0],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${angle * 2}deg`],
  });

  return (
    <Animated.Text
      style={[
        styles.burstNote,
        {
          color,
          fontSize: size,
          textShadowColor: color,
          transform: [{ translateX }, { translateY }, { scale }, { rotate }],
          opacity,
        },
      ]}
    >
      {symbol}
    </Animated.Text>
  );
};

/**
 * Volumetric Expanding Smoke Cloud Puff
 */
const SmokeCloudPuff = ({ offsetX, offsetY, size, color, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start();
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.2, 2.4, 4.5],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.15, 0.6, 1],
    outputRange: [0, 0.75, 0.5, 0],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, offsetX * 1.8],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, offsetY * 1.8],
  });

  return (
    <Animated.View
      style={[
        styles.smokePuff,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
};

/**
 * Master Exact Uploaded Wireframe Mustang Animation Controller
 */
const OtpCarAnimation = ({ 
  otp = '', 
  otpSent = false,
  isSuccessTriggered = false,
  isErrorTriggered = false,
  isGoogleTriggered = false,
  onAnimationComplete, 
  isDesktop = true 
}) => {
  // Phase state: 'idle' | 'orbiting' | 'merged' | 'transit' | 'attached' | 'driving' | 'google_flight' | 'burst' | 'done'
  const [phase, setPhase] = useState('idle');

  // Error Shake Animation
  const errorShakeX = useRef(new Animated.Value(0)).current;

  // Elliptical Orbit values
  const orbitAngle = useRef(new Animated.Value(0)).current;
  const orbitRadius = useRef(new Animated.Value(64)).current;

  // Single Merged Singularity Orb
  const mergedOrbScale = useRef(new Animated.Value(0)).current;
  const mergedOrbOpacity = useRef(new Animated.Value(0)).current;

  // 2 Transiting Wheels
  const wheel1X = useRef(new Animated.Value(0)).current;
  const wheel1Y = useRef(new Animated.Value(0)).current;
  const wheel2X = useRef(new Animated.Value(0)).current;
  const wheel2Y = useRef(new Animated.Value(0)).current;
  const wheelsOpacity = useRef(new Animated.Value(0)).current;

  // Car Motion & Idle Engine Rumble
  const carTranslateX = useRef(new Animated.Value(0)).current;
  const carIdleVibe = useRef(new Animated.Value(0)).current;
  const carOpacity = useRef(new Animated.Value(1)).current;
  const carScale = useRef(new Animated.Value(1)).current;

  // Burst Shockwave Ring
  const shockwaveScale = useRef(new Animated.Value(0)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;

  const isNative = Platform.OS !== 'web';

  // Engine idle suspension rumble
  useEffect(() => {
    const idleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(carIdleVibe, {
          toValue: -1,
          duration: 180,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: isNative,
        }),
        Animated.timing(carIdleVibe, {
          toValue: 1,
          duration: 180,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: isNative,
        }),
      ])
    );
    idleLoop.start();
    return () => idleLoop.stop();
  }, []);

  // Handle Incorrect OTP Error Behavior
  useEffect(() => {
    if (isErrorTriggered) {
      Animated.sequence([
        Animated.timing(errorShakeX, { toValue: -8, duration: 60, useNativeDriver: isNative }),
        Animated.timing(errorShakeX, { toValue: 8, duration: 60, useNativeDriver: isNative }),
        Animated.timing(errorShakeX, { toValue: -6, duration: 60, useNativeDriver: isNative }),
        Animated.timing(errorShakeX, { toValue: 6, duration: 60, useNativeDriver: isNative }),
        Animated.timing(errorShakeX, { toValue: 0, duration: 60, useNativeDriver: isNative }),
      ]).start();
    }
  }, [isErrorTriggered]);

  // Handle Correct OTP Success Behavior
  useEffect(() => {
    if (isSuccessTriggered && phase === 'idle') {
      runSuccessSequence();
    }
  }, [isSuccessTriggered]);

  // ========================================================
  // GOOGLE SIGN-IN WHEEL-LESS CAR FLIGHT & EXPLOSIVE SMOKE
  // ========================================================
  useEffect(() => {
    if (isGoogleTriggered && phase === 'idle') {
      runGoogleWheelLessBurstSequence();
    }
  }, [isGoogleTriggered]);

  const runGoogleWheelLessBurstSequence = () => {
    setPhase('google_flight');

    // 1. Wheel-less car accelerates smoothly across top of tab to the right edge
    const burstTargetX = isDesktop ? 980 : 540;

    Animated.timing(carTranslateX, {
      toValue: burstTargetX,
      duration: 1200,
      easing: Easing.bezier(0.35, 0, 0.25, 1),
      useNativeDriver: isNative,
    }).start(() => {
      
      // 2. Car reaches end of tab: BURST EXPLOSION!
      setPhase('burst');

      // Flash & Disintegrate car
      Animated.parallel([
        Animated.timing(carScale, {
          toValue: 2.5,
          duration: 180,
          useNativeDriver: isNative,
        }),
        Animated.timing(carOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: isNative,
        }),
        // Shockwave expansion
        Animated.sequence([
          Animated.parallel([
            Animated.timing(shockwaveScale, {
              toValue: 3.8,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: isNative,
            }),
            Animated.timing(shockwaveOpacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: isNative,
            })
          ]),
          Animated.timing(shockwaveOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: isNative,
          })
        ])
      ]).start(() => {
        // 3. Complete authentication after full smoke and music eruption
        setTimeout(() => {
          setPhase('done');
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }, 800);
      });

    });
  };

  const runSuccessSequence = () => {
    // 1. Fast 3D Elliptical Orbit
    setPhase('orbiting');
    
    Animated.parallel([
      Animated.timing(orbitAngle, {
        toValue: 6,
        duration: 1100,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: isNative,
      }),
      Animated.sequence([
        Animated.timing(orbitRadius, {
          toValue: 80,
          duration: 350,
          useNativeDriver: false,
        }),
        Animated.timing(orbitRadius, {
          toValue: 2,
          duration: 750,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        })
      ])
    ]).start(() => {
      
      // 2. Collapse into 1 Glowing Singularity Orb
      setPhase('merged');
      Animated.sequence([
        Animated.parallel([
          Animated.timing(mergedOrbScale, {
            toValue: 2.2,
            duration: 250,
            useNativeDriver: isNative,
          }),
          Animated.timing(mergedOrbOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: isNative,
          })
        ]),
        Animated.parallel([
          Animated.timing(mergedOrbScale, {
            toValue: 0.1,
            duration: 200,
            useNativeDriver: isNative,
          }),
          Animated.timing(mergedOrbOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: isNative,
          })
        ])
      ]).start(() => {

        // 3. Split into 2 Wheels and Travel across to the Mustang
        setPhase('transit');
        wheelsOpacity.setValue(1);

        const targetRearX = isDesktop ? -1090 : 29;
        const targetFrontX = isDesktop ? -890 : 161;
        const targetY = isDesktop ? -175 : -70;

        Animated.parallel([
          // Rear Wheel Flight
          Animated.timing(wheel1X, {
            toValue: targetRearX,
            duration: 900,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: isNative,
          }),
          Animated.timing(wheel1Y, {
            toValue: targetY,
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver: isNative,
          }),
          // Front Wheel Flight
          Animated.timing(wheel2X, {
            toValue: targetFrontX,
            duration: 950,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: isNative,
          }),
          Animated.timing(wheel2Y, {
            toValue: targetY,
            duration: 950,
            easing: Easing.out(Easing.quad),
            useNativeDriver: isNative,
          })
        ]).start(() => {
          
          // 4. Wheels Locked onto Car!
          setPhase('attached');

          // 5. Long Distance Acceleration with full Smoke & Music Symbols!
          setTimeout(() => {
            setPhase('driving');

            Animated.timing(carTranslateX, {
              toValue: isDesktop ? 1650 : 900,
              duration: 2100,
              easing: Easing.bezier(0.35, 0.0, 0.2, 1),
              useNativeDriver: isNative,
            }).start(() => {
              setPhase('burst');
              setTimeout(() => {
                setPhase('done');
                if (onAnimationComplete) {
                  onAnimationComplete();
                }
              }, 1000);
            });
          }, 200);

        });
      });
    });
  };

  // Dimensions of Mustang
  const carWidth = isDesktop ? 350 : 230;
  const carHeight = (carWidth * 137) / 527;
  const wheelSize = isDesktop ? 46 : 30;

  // Relative wheel coordinates
  const rearWheelLeft = isDesktop ? 47 : 31;
  const frontWheelLeft = isDesktop ? 248 : 163;
  const wheelBottom = isDesktop ? -2 : -1;

  // Silencer Tailpipe coordinates
  const exhaustX = 6;
  const exhaustY = carHeight - 20;

  // Burst explosion coordinates (right end of tab)
  const burstOriginX = isDesktop ? 680 : 340;
  const burstOriginY = -70;

  // Render 6 Wheel Items on Left Side (Mobile inside red box) or Right Side (Desktop)
  const renderRightTyreMatrix = () => {
    if (!otpSent) return null;

    const starIndices = isDesktop
      ? [
          [0, 1, 2], // Row 1
          [3, 4, 5], // Row 2
        ]
      : [
          [0, 1],    // Row 1 (top)
          [2, 3],    // Row 2 (middle)
          [4, 5],    // Row 3 (bottom)
        ];

    const tyreSize = isDesktop ? 52 : 28;

    if (phase === 'idle') {
      return (
        <Animated.View style={[isDesktop ? styles.matrixContainer : styles.matrixContainerMobile, { transform: [{ translateX: errorShakeX }] }]}>
          {isErrorTriggered && (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>⚠️ OTP is invalid</Text>
            </View>
          )}

          {starIndices.map((row, rIdx) => (
            <View key={rIdx} style={[styles.matrixRow, !isDesktop && styles.matrixRowMobile]}>
              {row.map((idx) => {
                const isEntered = otp.length > idx;
                return (
                  <AnticlockwiseTyreItem
                    key={idx}
                    isEntered={isEntered}
                    isError={isErrorTriggered}
                    isSpinning={isErrorTriggered}
                    size={tyreSize}
                  />
                );
              })}
            </View>
          ))}
        </Animated.View>
      );
    }

    // Eclipse Orbit Mode
    const nodes = [0, 1, 2, 3, 4, 5];
    return (
      <View style={styles.orbitCenter}>
        {nodes.map((i) => {
          const angleOffset = (i * 60 * Math.PI) / 180;

          const animatedX = orbitAngle.interpolate({
            inputRange: [0, 1, 2, 3, 4, 5, 6],
            outputRange: [
              Math.cos(angleOffset) * 64,
              Math.cos(angleOffset + Math.PI) * 72,
              Math.cos(angleOffset + 2 * Math.PI) * 66,
              Math.cos(angleOffset + 3 * Math.PI) * 52,
              Math.cos(angleOffset + 4 * Math.PI) * 36,
              Math.cos(angleOffset + 5 * Math.PI) * 18,
              0
            ],
          });

          const animatedY = orbitAngle.interpolate({
            inputRange: [0, 1, 2, 3, 4, 5, 6],
            outputRange: [
              Math.sin(angleOffset) * 32,
              Math.sin(angleOffset + Math.PI) * 38,
              Math.sin(angleOffset + 2 * Math.PI) * 34,
              Math.sin(angleOffset + 3 * Math.PI) * 26,
              Math.sin(angleOffset + 4 * Math.PI) * 18,
              Math.sin(angleOffset + 5 * Math.PI) * 9,
              0
            ],
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.orbitNode,
                {
                  transform: [
                    { translateX: animatedX },
                    { translateY: animatedY },
                  ],
                },
              ]}
            >
              <Image
                source={MUSTANG_WHEEL}
                style={{ width: 36, height: 36, resizeMode: 'contain' }}
              />
            </Animated.View>
          );
        })}

        {phase === 'merged' && (
          <Animated.View
            style={[
              styles.mergedOrb,
              {
                transform: [{ scale: mergedOrbScale }],
                opacity: mergedOrbOpacity,
              },
            ]}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="none">
      
      {/* ======================================================== */}
      {/* 1. TOP-LEFT OUTSIDE CARD: EXACT MUSTANG WIREFRAME        */}
      {/* ======================================================== */}
      <Animated.View
        style={[
          styles.carAnchor,
          isDesktop ? styles.carAnchorDesktop : styles.carAnchorMobile,
          {
            opacity: carOpacity,
            transform: [
              { translateX: carTranslateX },
              { translateY: carIdleVibe },
              { scale: carScale }
            ],
          },
        ]}
      >
        {/* Exhaust Tailpipe Colorful Musical Notes */}
        <View style={[styles.exhaustOrigin, { left: exhaustX, top: exhaustY }]}>
          <FloatingMusicSymbol symbol="𝄞" color="#00E5FF" delay={0} startX={0} startY={0} />
          <FloatingMusicSymbol symbol="♪" color="#EC4899" delay={250} startX={-4} startY={2} />
          <FloatingMusicSymbol symbol="♫" color="#A855F7" delay={500} startX={-2} startY={-3} />
          <FloatingMusicSymbol symbol="♬" color="#FACC15" delay={750} startX={-6} startY={1} />
          <FloatingMusicSymbol symbol="🎵" color="#10B981" delay={1000} startX={-3} startY={-2} />
          <FloatingMusicSymbol symbol="🎶" color="#38BDF8" delay={1250} startX={-5} startY={0} />
        </View>

        {/* Wheel-less Wireframe Mustang Chassis */}
        <Image
          source={MUSTANG_CHASSIS}
          style={{
            width: carWidth,
            height: carHeight,
            resizeMode: 'contain',
          }}
        />

        {/* Attached Wheels (Only on OTP verification success) */}
        {(phase === 'attached' || phase === 'driving') && (
          <>
            <View style={[styles.lockedWheelBox, { left: rearWheelLeft, bottom: wheelBottom }]}>
              <RealisticSpinningWheel size={wheelSize} isSpinning={phase === 'driving'} />
            </View>
            <View style={[styles.lockedWheelBox, { left: frontWheelLeft, bottom: wheelBottom }]}>
              <RealisticSpinningWheel size={wheelSize} isSpinning={phase === 'driving'} />
            </View>
          </>
        )}
      </Animated.View>

      {/* ======================================================== */}
      {/* 2. BURST SMOKE & MUSICAL SYMBOLS ERUPTION               */}
      {/* ======================================================== */}
      {(phase === 'burst' || phase === 'done') && (
        <View style={[styles.burstContainer, { left: burstOriginX, top: burstOriginY }]}>
          
          {/* Shockwave Blast Ring */}
          <Animated.View
            style={[
              styles.shockwaveRing,
              {
                transform: [{ scale: shockwaveScale }],
                opacity: shockwaveOpacity,
              },
            ]}
          />

          {/* Volumetric Smoke Cloud Puffs Filling the Entire Tab */}
          <SmokeCloudPuff offsetX={-120} offsetY={-60} size={140} color="rgba(0, 229, 255, 0.45)" delay={0} />
          <SmokeCloudPuff offsetX={110} offsetY={-50} size={150} color="rgba(147, 51, 234, 0.4)" delay={30} />
          <SmokeCloudPuff offsetX={-160} offsetY={80} size={160} color="rgba(236, 72, 153, 0.4)" delay={50} />
          <SmokeCloudPuff offsetX={140} offsetY={90} size={170} color="rgba(6, 182, 212, 0.45)" delay={70} />
          <SmokeCloudPuff offsetX={0} offsetY={-130} size={160} color="rgba(255, 255, 255, 0.55)" delay={90} />
          <SmokeCloudPuff offsetX={-80} offsetY={120} size={180} color="rgba(14, 116, 144, 0.5)" delay={110} />
          <SmokeCloudPuff offsetX={180} offsetY={0} size={170} color="rgba(56, 189, 248, 0.45)" delay={130} />
          <SmokeCloudPuff offsetX={-220} offsetY={-10} size={190} color="rgba(250, 204, 21, 0.35)" delay={150} />
          <SmokeCloudPuff offsetX={0} offsetY={150} size={200} color="rgba(0, 229, 255, 0.5)" delay={170} />

          {/* Dense Billowing Center Smoke */}
          <SmokeCloudPuff offsetX={0} offsetY={0} size={220} color="rgba(255, 255, 255, 0.65)" delay={0} />
          <SmokeCloudPuff offsetX={30} offsetY={-20} size={210} color="rgba(0, 229, 255, 0.55)" delay={40} />

          {/* 360-Degree Radial Explosive Musical Symbols Burst */}
          <ExplodingMusicParticle symbol="𝄞" color="#00E5FF" angle={0} distance={220} size={36} />
          <ExplodingMusicParticle symbol="♫" color="#EC4899" angle={30} distance={240} size={30} />
          <ExplodingMusicParticle symbol="♪" color="#FACC15" angle={60} distance={200} size={32} />
          <ExplodingMusicParticle symbol="♬" color="#A855F7" angle={90} distance={230} size={34} />
          <ExplodingMusicParticle symbol="🎵" color="#10B981" angle={120} distance={210} size={32} />
          <ExplodingMusicParticle symbol="🎶" color="#38BDF8" angle={150} distance={250} size={34} />
          <ExplodingMusicParticle symbol="𝄢" color="#EC4899" angle={180} distance={230} size={36} />
          <ExplodingMusicParticle symbol="𝄞" color="#00E5FF" angle={210} distance={240} size={34} />
          <ExplodingMusicParticle symbol="✨" color="#FACC15" angle={240} distance={220} size={28} />
          <ExplodingMusicParticle symbol="♫" color="#A855F7" angle={270} distance={210} size={32} />
          <ExplodingMusicParticle symbol="♪" color="#10B981" angle={300} distance={230} size={30} />
          <ExplodingMusicParticle symbol="♬" color="#38BDF8" angle={330} distance={250} size={34} />
          
          {/* Inner Burst Sparks */}
          <ExplodingMusicParticle symbol="⭐" color="#FFFFFF" angle={45} distance={130} size={24} />
          <ExplodingMusicParticle symbol="✨" color="#00E5FF" angle={135} distance={140} size={24} />
          <ExplodingMusicParticle symbol="⭐" color="#EC4899" angle={225} distance={135} size={24} />
          <ExplodingMusicParticle symbol="✨" color="#FACC15" angle={315} distance={145} size={24} />
        </View>
      )}

      {/* ======================================================== */}
      {/* 3. 6 TYRES (OTP MODE ONLY - LEFT ON MOBILE, RIGHT ON DESKTOP) */}
      {/* ======================================================== */}
      {otpSent && (
        <View style={isDesktop ? styles.rightStageDesktop : styles.leftStageMobile}>
          {renderRightTyreMatrix()}

          {phase === 'transit' && (
            <>
              <Animated.View
                style={[
                  styles.flyingWheel,
                  {
                    opacity: wheelsOpacity,
                    transform: [
                      { translateX: wheel1X },
                      { translateY: wheel1Y },
                    ],
                  },
                ]}
              >
                <RealisticSpinningWheel size={wheelSize} isSpinning={true} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.flyingWheel,
                  {
                    opacity: wheelsOpacity,
                    transform: [
                      { translateX: wheel2X },
                      { translateY: wheel2Y },
                    ],
                  },
                ]}
              >
                <RealisticSpinningWheel size={wheelSize} isSpinning={true} />
              </Animated.View>
            </>
          )}
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    zIndex: 100,
  },
  // Positioned on top-left ABOVE the login card
  carAnchor: {
    position: 'absolute',
    zIndex: 110,
  },
  carAnchorDesktop: {
    left: -320, // 7cm back
    top: -110,
  },
  carAnchorMobile: {
    left: 10,
    top: -80,
  },
  lockedWheelBox: {
    position: 'absolute',
    zIndex: 115,
  },
  exhaustOrigin: {
    position: 'absolute',
    width: 20,
    height: 20,
    zIndex: 125,
  },
  musicSymbolText: {
    position: 'absolute',
    fontSize: 26,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  rightStageDesktop: {
    position: 'absolute',
    right: -235,
    top: '50%',
    marginTop: -62,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 120,
  },
  leftStageMobile: {
    position: 'absolute',
    left: 18,
    top: 25,
    width: 78,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 120,
  },
  matrixContainer: {
    gap: 20,
    alignItems: 'center',
  },
  matrixContainerMobile: {
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  matrixRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tyreWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  errorBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1.2,
    borderColor: '#EF4444',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  errorBadgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orbitCenter: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orbitNode: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 229, 255, 0.22)',
    borderWidth: 1.8,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  mergedOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 3.5,
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 32,
  },
  flyingWheel: {
    position: 'absolute',
    zIndex: 130,
  },
  // Burst & Smoke Explosion styles
  burstContainer: {
    position: 'absolute',
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  shockwaveRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  smokePuff: {
    position: 'absolute',
    filter: 'blur(16px)',
  },
  burstNote: {
    position: 'absolute',
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
});

export default OtpCarAnimation;
