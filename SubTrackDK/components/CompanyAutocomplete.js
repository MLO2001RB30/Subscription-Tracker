import React, {useState, useEffect, useRef} from 'react';
import {
  View, TextInput, FlatList, TouchableOpacity,
  Text, Image, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For fallback icon
import Colors from '../constants/Colors';

const CompanyAutocomplete = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://autocomplete.clearbit.com/v1/companies/suggest?query=${query}`
        );
        const data = await res.json();
        setResults(data);
      } catch (e) {
        console.warn('Autocomplete fejl', e);
        setResults([]); // Clear results on error
      }
    }, 300); // 300ms debounce
  }, [query]);

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Søg abonnement…"
        placeholderTextColor="#999999"
        style={styles.input}
      />
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={item => item.domain || item.name} // Use domain as key, fallback to name
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  setQuery(item.name);
                  setResults([]);
                  onSelect({ name: item.name, domain: item.domain });
                }}
              >
                {item.logo ? (
                  <Image
                    source={{uri:item.logo}}
                    style={styles.logo}
                    onError={(e) => console.warn('Logo fejl', e.nativeEvent.error)}
                  />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="cube-outline" size={20} color="#1db954" />
                  </View>
                )}
                
                <Text style={styles.text}>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    width:'100%', 
    marginBottom: 0, 
    zIndex: 1, // Ensure dropdown is above other elements
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  resultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200, // Limit height of dropdown
    overflow: 'hidden',
    position: 'absolute',
    top: 65, // Position below the input field
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  row: {
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 12,
    borderRadius: 6,
  },
  logoPlaceholder: {
    width: 24,
    height: 24,
    marginRight: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '400',
  },
});

export default CompanyAutocomplete; 