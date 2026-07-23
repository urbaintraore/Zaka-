import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export async function getCurrentUserLocation(): Promise<{ lat: number, lng: number }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const checkPermission = await Geolocation.checkPermissions();
      if (checkPermission.location !== 'granted') {
        const requestPermission = await Geolocation.requestPermissions();
        if (requestPermission.location !== 'granted') {
          throw new Error('Permission de géolocalisation refusée');
        }
      }
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error: any) {
      console.error('Erreur Capacitor Geolocation:', error);
      throw error;
    }
  } else {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La géolocalisation n'est pas supportée par votre navigateur."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}
