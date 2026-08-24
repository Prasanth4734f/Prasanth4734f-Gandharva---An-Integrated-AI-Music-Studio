import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Users, LogOut, ChevronLeft, Calendar, Mail } from 'lucide-react-native';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import { COLORS, SIZES, SPACING } from '../../constants/theme';
import { supabase } from '../../services/supabase';

// Helper to fetch from our local backend endpoint
import apiClient from '../../services/apiClient';

const AdminDashboardScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Calls the /api/admin/users endpoint on the Node server
      const response = await apiClient('/admin/users');
      
      if (response && response.users) {
        setUsers(response.users);
      }
    } catch (error) {
      console.log('Admin fetch error', error);
      Alert.alert('Error', 'Failed to fetch users. Ensure Node server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ChevronLeft color={COLORS.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Admin Panel</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color={COLORS.error} size={20} />
          <Text style={styles.logoutText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Users color={COLORS.primary} size={32} />
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Registered Users</Text>
        </GlassCard>
      </View>

      <Text style={styles.sectionTitle}>User Directory</Text>
      
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {users.map((user) => (
            <GlassCard key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <Mail color={COLORS.textMuted} size={16} style={styles.userIcon} />
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={styles.userMeta}>
                <View style={styles.metaRow}>
                  <Calendar color={COLORS.textMuted} size={14} style={styles.userIcon} />
                  <Text style={styles.metaText}>Joined: {new Date(user.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.metaText}>ID: {user.id.substring(0, 8)}...</Text>
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.radius_sm,
    marginRight: SPACING.md,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SIZES.radius_sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.xl,
  },
  statNumber: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: SPACING.sm,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_md,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: SIZES.font_lg,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  list: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  userIcon: {
    marginRight: SPACING.sm,
  },
  userEmail: {
    color: COLORS.white,
    fontSize: SIZES.font_md,
    fontWeight: 'bold',
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_sm,
  }
});

export default AdminDashboardScreen;
