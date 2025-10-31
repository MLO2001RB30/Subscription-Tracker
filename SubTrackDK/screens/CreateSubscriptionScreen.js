import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet } from "react-native";
import { createSubscription } from "../api/api";

export default function CreateSubscriptionScreen() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = async () => {
    try {
      await createSubscription({
        title,
        amount: parseFloat(amount),
        renewal_date: new Date().toISOString().split("T")[0],
        category,
        logo_url: "https://logo.clearbit.com/example.com",
        currency: "DKK",
      });
      Alert.alert("Succes", "Abonnement oprettet!");
      // Clear form
      setTitle("");
      setAmount("");
      setCategory("");
    } catch (error) {
      Alert.alert("Fejl", "Kunne ikke oprette abonnement");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput 
        style={styles.input}
        placeholder="Navn" 
        value={title} 
        onChangeText={setTitle}
      />
      <TextInput 
        style={styles.input}
        placeholder="Pris" 
        value={amount} 
        onChangeText={setAmount} 
        keyboardType="numeric"
      />
      <TextInput 
        style={styles.input}
        placeholder="Kategori" 
        value={category} 
        onChangeText={setCategory}
      />
      <Button title="Tilføj abonnement" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
}); 