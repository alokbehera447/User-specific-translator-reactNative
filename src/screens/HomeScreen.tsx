import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');

const HomeScreen = ({navigation}: any) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation for main button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, pulseAnim, glowAnim]);

  const QuickActionButton = ({emoji, title, description, onPress, color, isPrimary = false}: any) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        isPrimary ? styles.primaryActionButton : {},
        {borderLeftColor: color}
      ]}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={[
        styles.actionIconContainer,
        isPrimary ? styles.primaryIconContainer : {}
      ]}>
        <Text style={[
          styles.actionEmoji,
          isPrimary ? styles.primaryEmoji : {}
        ]}>{emoji}</Text>
      </View>
      <View style={styles.actionTextContainer}>
        <Text style={[
          styles.actionTitle,
          isPrimary ? styles.primaryActionTitle : {}
        ]}>{title}</Text>
        <Text style={[
          styles.actionDescription,
          isPrimary ? styles.primaryActionDescription : {}
        ]}>{description}</Text>
      </View>
      <View style={[
        styles.arrowContainer,
        isPrimary ? styles.primaryArrowContainer : {},
        {backgroundColor: color}
      ]}>
        <Text style={[
          styles.actionArrow,
          isPrimary ? styles.primaryActionArrow : {}
        ]}>›</Text>
      </View>
      {isPrimary && (
        <Animated.View 
          style={[
            styles.glowEffect,
            {
              opacity: glowAnim,
              transform: [{scale: pulseAnim}]
            }
          ]} 
        />
      )}
    </TouchableOpacity>
  );

  const FeatureCard = ({emoji, title, desc, color}: any) => (
    <View style={styles.featureCard}>
      <View style={[styles.featureIcon, {backgroundColor: color}]}>
        <Text style={styles.featureEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{desc}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Enhanced Hero Section */}
      <Animated.View style={[styles.hero, {opacity: fadeAnim}]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroEmoji}>🗣️</Text>
          <Text style={styles.heroTitle}>Voice Translator Pro</Text>
          <Text style={styles.heroSubtitle}>
            Real-time translation with personalized voice cloning
          </Text>
        </View>
        <View style={styles.heroWave} />
        
        {/* Floating elements for visual interest */}
        <View style={styles.floatingElement1} />
        <View style={styles.floatingElement2} />
        <View style={styles.floatingElement3} />
      </Animated.View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Get Started</Text>
        
        {/* Primary Action Button - Stands Out */}
        <Animated.View style={{transform: [{scale: pulseAnim}]}}>
          <QuickActionButton
            emoji="🎤"
            title="Start Translating Now"
            description="Tap to record & translate instantly"
            onPress={() => navigation.navigate('Translator')}
            color="#0ea5e9"
            isPrimary={true}
          />
        </Animated.View>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          <QuickActionButton
            emoji="🎭"
            title="Voice Library"
            description="Manage your voice profiles"
            onPress={() => navigation.navigate('AccentLibrary')}
            color="#8b5cf6"
          />
          
          <QuickActionButton
            emoji="📊"
            title="Translation History"
            description="View your past translations"
            onPress={() => navigation.navigate('History')}
            color="#10b981"
          />
        </View>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Powerful Features</Text>
        <View style={styles.grid}>
          {[
            {emoji: '🎤', title: 'Speech Recognition', desc: '90+ languages', color: '#3b82f6'},
            {emoji: '🌍', title: 'AI Translation', desc: '200+ languages', color: '#06b6d4'},
            {emoji: '🗣️', title: 'Voice Cloning', desc: 'Personalized output', color: '#8b5cf6'},
            {emoji: '⚡', title: 'Real-time', desc: 'Instant processing', color: '#10b981'},
          ].map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>
      </View>

      {/* Usage Stats */}
      <View style={styles.statsContainer}>
        {[
          {number: '90+', label: 'Languages'},
          {number: '200+', label: 'Translations'},
          {number: '99%', label: 'Accuracy'},
        ].map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statNumber}>{stat.number}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Call to Action Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Ready to break language barriers? 
        </Text>
        <Text style={styles.footerSubtext}>
          Start translating now and experience seamless communication
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#0ea5e9',
    paddingTop: 60,
    paddingBottom: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    textAlign: 'center',
    lineHeight: 24,
  },
  heroWave: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 1,
  },
  floatingElement1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  floatingElement2: {
    position: 'absolute',
    top: '40%',
    right: '15%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  floatingElement3: {
    position: 'absolute',
    bottom: '30%',
    left: '20%',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionsContainer: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Primary Action Button Styles
  primaryActionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#0ea5e9',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderLeftWidth: 6,
    borderLeftColor: '#0ea5e9',
    position: 'relative',
    overflow: 'hidden',
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
  },
  primaryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#0ea5e9',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  primaryEmoji: {
    fontSize: 28,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTextContainer: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  primaryActionDescription: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  actionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  primaryArrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionArrow: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  actionArrow: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    backgroundColor: '#0ea5e9',
    zIndex: -1,
  },
  secondaryActions: {
    marginTop: 8,
  },
  featuresContainer: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    margin: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HomeScreen;