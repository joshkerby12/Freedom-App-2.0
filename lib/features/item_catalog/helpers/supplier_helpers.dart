import 'dart:math';

import '../models/item_catalog_models.dart';

double _toRadians(double degrees) => degrees * (pi / 180);

double haversineDistanceKm({
  required double lat1,
  required double lng1,
  required double lat2,
  required double lng2,
}) {
  const earthRadiusKm = 6371.0;

  final dLat = _toRadians(lat2 - lat1);
  final dLng = _toRadians(lng2 - lng1);
  final a =
      sin(dLat / 2) * sin(dLat / 2) +
      cos(_toRadians(lat1)) *
          cos(_toRadians(lat2)) *
          sin(dLng / 2) *
          sin(dLng / 2);

  final c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return earthRadiusKm * c;
}

SupplierLocation? nearestSupplierLocation(
  List<SupplierLocation> locations, {
  required double targetLat,
  required double targetLng,
}) {
  SupplierLocation? nearest;
  var nearestDistanceKm = double.infinity;

  for (final location in locations) {
    if (location.lat == null || location.lng == null) {
      continue;
    }

    final distance = haversineDistanceKm(
      lat1: targetLat,
      lng1: targetLng,
      lat2: location.lat!,
      lng2: location.lng!,
    );

    if (distance < nearestDistanceKm) {
      nearestDistanceKm = distance;
      nearest = location;
    }
  }

  return nearest;
}
