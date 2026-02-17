import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { API_URL } from '../config';

interface AttendanceStats {
  total_employees: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  attendance_rate: number;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      Alert.alert('Error', 'Failed to fetch attendance statistics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.total_employees || 0}</Text>
          <Text style={styles.statLabel}>Total Employees</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.present_today || 0}</Text>
          <Text style={styles.statLabel}>Present Today</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.absent_today || 0}</Text>
          <Text style={styles.statLabel}>Absent Today</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.late_today || 0}</Text>
          <Text style={styles.statLabel}>Late Today</Text>
        </View>

        <View style={[styles.statCard, styles.attendanceRateCard]}>
          <Text style={styles.attendanceRateValue}>
            {stats?.attendance_rate.toFixed(1) || '0'}%
          </Text>
          <Text style={styles.statLabel}>Attendance Rate</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    padding: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  attendanceRateCard: {
    backgroundColor: '#34C759',
  },
  attendanceRateValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
}); 