import { calculateAffineTransform, validateReferencePoints } from './coordinateTransform';
import { Point } from '../types';

// Test function to verify coordinate transformations
export function testCoordinateTransform() {
  console.log('Testing coordinate transformations...');

  // Test case 1: Simple 2-point transformation
  const imagePoints2: Point[] = [
    { id: 1, lat: 0, lng: 0, x: 0, y: 0 },
    { id: 2, lat: 0, lng: 0, x: 100, y: 100 }
  ];

  const mapPoints2: Point[] = [
    { id: 1, lat: 40.4168, lng: -3.7038, x: 0, y: 0 },
    { id: 2, lat: 40.4268, lng: -3.6938, x: 0, y: 0 }
  ];

  console.log('Testing 2-point transformation...');
  try {
    const transform2 = calculateAffineTransform(imagePoints2, mapPoints2);
    console.log('2-point transform:', transform2);
    console.log('✅ 2-point transformation successful');
  } catch (error) {
    console.error('❌ 2-point transformation failed:', error);
  }

  // Test case 2: 4-point transformation
  const imagePoints4: Point[] = [
    { id: 1, lat: 0, lng: 0, x: 0, y: 0 },
    { id: 2, lat: 0, lng: 0, x: 100, y: 0 },
    { id: 3, lat: 0, lng: 0, x: 0, y: 100 },
    { id: 4, lat: 0, lng: 0, x: 100, y: 100 }
  ];

  const mapPoints4: Point[] = [
    { id: 1, lat: 40.4168, lng: -3.7038, x: 0, y: 0 },
    { id: 2, lat: 40.4168, lng: -3.6938, x: 0, y: 0 },
    { id: 3, lat: 40.4268, lng: -3.7038, x: 0, y: 0 },
    { id: 4, lat: 40.4268, lng: -3.6938, x: 0, y: 0 }
  ];

  console.log('Testing 4-point transformation...');
  try {
    const transform4 = calculateAffineTransform(imagePoints4, mapPoints4);
    console.log('4-point transform:', transform4);
    console.log('✅ 4-point transformation successful');
  } catch (error) {
    console.error('❌ 4-point transformation failed:', error);
  }

  // Test validation
  console.log('Testing point validation...');
  const isValid = validateReferencePoints(imagePoints4, mapPoints4);
  console.log('Validation result:', isValid);
  console.log('✅ Validation test completed');

  console.log('All tests completed!');
} 