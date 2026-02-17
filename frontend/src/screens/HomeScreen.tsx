import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text } from 'react-native-paper';

export const HomeScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.welcomeText}>Welcome!</Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Face Verification</Title>
          <Paragraph>Verify your identity using facial recognition</Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Verification')}
          >
            Start Verification
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.buttonGrid}>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              onPress={() => navigation.navigate('Profile')}
            >
              View Profile
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              onPress={() => navigation.navigate('Settings')}
            >
              Settings
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Activity</Title>
          <Paragraph>No recent verification attempts</Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  welcomeText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gridButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
