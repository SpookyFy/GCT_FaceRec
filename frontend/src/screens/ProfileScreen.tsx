import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Avatar, List, Text, Divider, Button } from 'react-native-paper';

export const ProfileScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image
          size={100}
          source={{ uri: 'https://ui-avatars.com/api/?name=User' }}
        />
        <Text variant="headlineSmall" style={styles.name}>User Name</Text>
        <Text variant="bodyMedium" style={styles.email}>user@example.com</Text>
      </View>

      <List.Section>
        <List.Subheader>Personal Information</List.Subheader>
        <List.Item
          title="Full Name"
          description="User Name"
          left={props => <List.Icon {...props} icon="account" />}
        />
        <List.Item
          title="Email"
          description="user@example.com"
          left={props => <List.Icon {...props} icon="email" />}
        />
        <List.Item
          title="Phone"
          description="+1 234 567 8900"
          left={props => <List.Icon {...props} icon="phone" />}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Security</List.Subheader>
        <List.Item
          title="Face ID Status"
          description="Enabled"
          left={props => <List.Icon {...props} icon="face-recognition" />}
        />
        <List.Item
          title="Last Verification"
          description="Never"
          left={props => <List.Icon {...props} icon="clock" />}
        />
      </List.Section>

      <View style={styles.buttonContainer}>
        <Button mode="outlined" style={styles.button}>
          Edit Profile
        </Button>
        <Button mode="contained" style={styles.button}>
          Update Face ID
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  name: {
    marginTop: 10,
    marginBottom: 5,
  },
  email: {
    opacity: 0.7,
  },
  buttonContainer: {
    padding: 16,
    gap: 10,
  },
  button: {
    marginVertical: 4,
  },
});
