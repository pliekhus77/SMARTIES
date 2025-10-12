import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface RecentScan {
  id: string;
  name: string;
  icon: string;
  status: 'safe' | 'warning' | 'danger';
  allergenStatus?: 'safe' | 'warning' | 'danger';
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

  const recentScans: RecentScan[] = [
    {
      id: '1',
      name: 'Chocolate Bar',
      icon: '🍫',
      status: 'danger',
      allergenStatus: 'danger'
    },
    {
      id: '2', 
      name: 'Pasta Sauce',
      icon: '🍝',
      status: 'warning',
      allergenStatus: 'safe'
    },
    {
      id: '3',
      name: 'Seltzer Water', 
      icon: '🥤',
      status: 'safe',
      allergenStatus: 'safe'
    }
  ];

  const getStatusIcon = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'safe':
        return { icon: 'checkmark-circle', color: '#2ECC40' };
      case 'warning':
        return { icon: 'warning', color: '#FFDC00' };
      case 'danger':
        return { icon: 'alert-circle', color: '#FF4136' };
    }
  };

  const getAllergenStatusIcon = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'safe':
        return { icon: 'checkmark', color: '#2ECC40' };
      case 'warning':
        return { icon: 'warning', color: '#FFDC00' };
      case 'danger':
        return { icon: 'close', color: '#FF4136' };
    }
  };

  const handleScanPress = () => {
    navigation.navigate('Scan' as never);
  };

  const handleBottomNavPress = (screen: string) => {
    if (screen === 'Home') return; // Already on home
    navigation.navigate(screen as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/smarties-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Scan Button */}
        <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
          <View style={styles.scanButtonIcon}>
            <Ionicons name="barcode-outline" size={49} color="#fff" />
          </View>
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </TouchableOpacity>

        {/* Recent Scans */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <View style={styles.recentScans}>
            {recentScans.map((scan) => {
              const statusIcon = getStatusIcon(scan.status);
              const allergenIcon = getAllergenStatusIcon(scan.allergenStatus || 'safe');
              
              return (
                <View key={scan.id} style={styles.scanItem}>
                  <View style={styles.scanItemLeft}>
                    <View style={styles.productIcon}>
                      <Text style={styles.scanIcon}>{scan.icon}</Text>
                    </View>
                    <Text style={styles.scanName}>{scan.name}</Text>
                  </View>
                  <View style={styles.scanItemRight}>
                    <View style={[styles.statusIcon, { backgroundColor: statusIcon.color }]}>
                      <Ionicons 
                        name={statusIcon.icon as any} 
                        size={32} 
                        color="#fff" 
                      />
                    </View>
                    <View style={[styles.allergenIcon, { backgroundColor: allergenIcon.color }]}>
                      <Ionicons 
                        name={allergenIcon.icon as any} 
                        size={24} 
                        color="#fff" 
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Status Summary */}
        <View style={styles.statusSummary}>
          <View style={styles.statusItem}>
            <Ionicons name="warning" size={20} color="#FF9500" />
            <Text style={styles.statusText}>1 caution: contains dairy</Text>
          </View>
          <Text style={styles.statusSubtext}>All clear!</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, styles.activeNavItem]} 
          onPress={() => handleBottomNavPress('Home')}
        >
          <Ionicons name="home" size={24} color="#1168bd" />
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleBottomNavPress('History')}
        >
          <Ionicons name="time-outline" size={24} color="#999" />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleBottomNavPress('Profile')}
        >
          <Ionicons name="person-outline" size={24} color="#999" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleBottomNavPress('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#999" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E88E5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 8, // Reduced from 15 to 8 (half of previous 25 total spacing)
  },
  logoContainer: {
    marginBottom: 5, // Reduced from 10 to 5 (half of previous 25 total spacing)
  },
  logo: {
    width: 211, // Increased from 176 to 211 (120% larger: 176 × 1.2 = 211)
    height: 211, // Increased from 176 to 211 (120% larger: 176 × 1.2 = 211)
  },

  scanButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 25,
    paddingVertical: 26, // Increased from 22 to 26 (120% taller)
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonIcon: {
    marginRight: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 26, // Increased from 24 to 26 (110% bigger)
    fontWeight: 'bold',
  },
  recentSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  recentScans: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scanItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productIcon: {
    width: 80, // Increased from 40 to 80 (200% size)
    height: 80, // Increased from 40 to 80 (200% size)
    borderRadius: 40, // Increased from 20 to 40 (200% size)
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  scanIcon: {
    fontSize: 30, // Reduced from 40 to 30 (25% reduction)
  },
  scanName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  scanItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIcon: {
    width: 56, // Increased from 28 to 56 (200% size)
    height: 56, // Increased from 28 to 56 (200% size)
    borderRadius: 28, // Increased from 14 to 28 (200% size)
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergenIcon: {
    width: 48, // Increased from 24 to 48 (200% size)
    height: 48, // Increased from 24 to 48 (200% size)
    borderRadius: 24, // Increased from 12 to 24 (200% size)
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSummary: {
    backgroundColor: '#FFF3CD',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  statusSubtext: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: 'rgba(17, 104, 189, 0.1)',
    borderRadius: 20,
  },
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#1168bd',
    fontWeight: 'bold',
  },
});

export default HomeScreen;