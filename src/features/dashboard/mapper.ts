import type {
  LabsDashboardRetrieveApiResponse,
  LabsDashboardSummaryRetrieveApiResponse,
  LabsDashboardBenchesRetrieveByBenchIdApiResponse,
  LabsBenchGroupsRetrieveApiResponse,
  LabsBenchesActionsFavoriteCreateByBenchIdApiResponse,
} from '@/shared/api/generated/api';
import type {
  BenchGroup,
  DashboardBench,
  DashboardBenchDetail,
  DashboardPageResponse,
  DashboardSummaryResponse,
  LabEquipmentDetail,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RecordValue = Record<string, unknown>;

const asRecord = (value: unknown): RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RecordValue)
    : {};

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

// ─── Map Dashboard Bench Item ─────────────────────────────────────────────────

export function mapDashboardBench(
  dto: LabsDashboardRetrieveApiResponse['data'][number] | RecordValue,
): DashboardBench {
  const item = asRecord(dto);
  const location = item.location ? asRecord(item.location) : null;
  const benchGroup = item.bench_group ? asRecord(item.bench_group) : null;
  const benchType = item.bench_type ? asRecord(item.bench_type) : null;
  const booking = item.current_booking ? asRecord(item.current_booking) : null;
  const bookingUser = booking?.user ? asRecord(booking.user) : null;
  const computing = item.computing ? asRecord(item.computing) : null;

  const samples = asArray(item.samples).map((s) => {
    const rec = asRecord(s);
    return {
      id: asNumber(rec.id),
      sku: asString(rec.sku),
      name: asString(rec.name),
    };
  });

  const licenses = asArray(item.licenses).map((l) => {
    const rec = asRecord(l);
    return {
      id: asNumber(rec.id),
      sku: asString(rec.sku),
      name: asString(rec.name),
    };
  });

  const name = asString(item.name || item.lab_name);
  const roomName = location ? asString(asRecord(location.room).name) : '';
  const stationName = location ? asString(asRecord(location.station).name) : '';
  const locationName = [roomName, stationName].filter(Boolean).join(' - ');

  return {
    id: asNumber(item.id),
    sku: asString(item.sku),
    name,
    lifecycle_status: asString(item.lifecycle_status),
    bench_group: benchGroup
      ? {
          id: asNumber(benchGroup.id),
          name: asString(benchGroup.name || benchGroup.lab_group_name),
          description: asString(benchGroup.description),
        }
      : null,
    bench_type: benchType
      ? {
          id: asNumber(benchType.id),
          name: asString(benchType.name),
        }
      : null,
    location: location
      ? {
          ...locationRelations(location),
          slot_label: asNullableString(location.slot_label),
        }
      : null,
    is_favorite: Boolean(item.is_favorite),
    current_booking: booking
      ? {
          id: asNumber(booking.id),
          booking_code: asString(booking.booking_code),
          starts_at: asString(booking.starts_at || booking.from_date_time),
          ends_at: asString(booking.ends_at || booking.to_date_time),
          status: asString(booking.status),
          user: bookingUser
            ? {
                id: asNumber(bookingUser.id),
                username: asString(bookingUser.name),
                display_name: asString(bookingUser.name),
              }
            : null,
        }
      : null,
    computing: computing
      ? {
          id: asNumber(computing.id),
          sku: asString(computing.sku),
          name: asString(computing.name || computing.computer_name),
          ip_address: asNullableString(computing.ip_address || computing.computer_ip),
          os_name: asString(computing.os_name),
          rdp_file_url: asNullableString(computing.rdp_file_url || computing.rdp_file),
          activity_status: asString(computing.activity_status || computing.status),
          remote_user: asString(computing.remote_user),
          remote_user_display_name: asString(computing.remote_user_display_name),
          remote_ip: asNullableString(computing.remote_ip),
        }
      : null,
    samples,
    licenses,
    assigned_equipment_count: asNumber(item.assigned_equipment_count),
    image_url: asNullableString(item.image_url || item.image),
    updated_at: asString(item.updated_at),

    // Compatibility fields
    lab_name: name,
    location_name: locationName,
    location_url: asString(item.location_url || item.documentation_url),
    lab_group: benchGroup
      ? {
          id: asNumber(benchGroup.id),
          lab_group_name: asString(benchGroup.name || benchGroup.lab_group_name),
        }
      : null,
    computer: computing
      ? {
          id: asNumber(computing.id),
          computer_ip: asString(computing.ip_address || computing.computer_ip),
          computer_name: asString(computing.name || computing.computer_name),
          status: asString(computing.activity_status || computing.status),
          rdp_file: asString(computing.rdp_file_url || computing.rdp_file) || undefined,
        }
      : null,
    samples_list: samples,
    license_list: licenses,
    remote_user:
      computing && (computing.remote_user || computing.remote_user_display_name)
        ? {
            username: asString(computing.remote_user),
            displayname: asString(computing.remote_user_display_name || computing.remote_user),
          }
        : null,
    booking_status: {
      is_booked: Boolean(booking),
      booking_info: booking
        ? {
            id: asNumber(booking.id),
            booking_code: asString(booking.booking_code),
            from_date_time: asString(booking.starts_at || booking.from_date_time),
            to_date_time: asString(booking.ends_at || booking.to_date_time),
            status: asString(booking.status),
            creator: {
              id: bookingUser ? asNumber(bookingUser.id) : 0,
              username: bookingUser ? asString(bookingUser.name) : '',
            },
          }
        : null,
    },
  };
}

/** Legacy alias */
export const mapDashboardItem = mapDashboardBench;

// ─── Map Dashboard List Response ──────────────────────────────────────────────

export function mapDashboardListResponse(
  response: LabsDashboardRetrieveApiResponse | RecordValue | unknown[],
): DashboardPageResponse {
  if (Array.isArray(response)) {
    return {
      total_count: response.length,
      results: response.map((item) => mapDashboardBench(item as RecordValue)),
    };
  }

  const envelope = asRecord(response);
  const data = envelope.data;

  if (Array.isArray(data)) {
    const pagination = asRecord(asRecord(envelope.meta).pagination);
    const totalCount = asNumber(pagination.count, data.length);
    return {
      total_count: totalCount,
      results: data.map((item) => mapDashboardBench(item as RecordValue)),
    };
  }

  // Handle nested results wrapper if present
  const dataRec = asRecord(data);
  const results = asArray(dataRec.results || data);
  const totalCount = asNumber(dataRec.total_count || dataRec.count, results.length);
  return {
    total_count: totalCount,
    results: results.map((item) => mapDashboardBench(item as RecordValue)),
  };
}

// ─── Map Dashboard Summary Response ───────────────────────────────────────────

export function mapDashboardSummaryResponse(
  dto: LabsDashboardSummaryRetrieveApiResponse | RecordValue,
): DashboardSummaryResponse {
  const envelope = asRecord(dto);
  const data = asRecord(envelope.data);
  const summary = asRecord(data.data ?? data);

  const totalBenches = asNumber(summary.total_benches || summary.total);
  const activeBookings = asNumber(summary.active_bookings_count);
  const favoritedCount = asNumber(summary.favorited_benches_count);
  const utilizationRate = asNumber(summary.utilization_rate);

  const lifecycleDistribution = Object.entries(
    asRecord(summary.lifecycle_distribution),
  ).reduce<Record<string, number>>((acc, [k, v]) => {
    acc[k] = asNumber(v);
    return acc;
  }, {});

  const activityDistribution = Object.entries(
    asRecord(summary.activity_distribution || summary.status),
  ).reduce<Record<string, number>>((acc, [k, v]) => {
    acc[k] = asNumber(v);
    return acc;
  }, {});

  return {
    total_benches: totalBenches,
    active_bookings_count: activeBookings,
    favorited_benches_count: favoritedCount,
    lifecycle_distribution: lifecycleDistribution,
    activity_distribution: activityDistribution,
    utilization_rate: utilizationRate,
    // Compatibility fields
    total: totalBenches,
    status: activityDistribution,
  };
}

// ─── Map Bench Groups ─────────────────────────────────────────────────────────

export function mapBenchGroupsResponse(
  dto: LabsBenchGroupsRetrieveApiResponse | RecordValue,
): BenchGroup[] {
  const envelope = asRecord(dto);
  const data = envelope.data;

  // SchemaRead3 format: { data: [{ groups: [...], types: [...] }] }
  if (Array.isArray(data)) {
    const groups: BenchGroup[] = [];
    for (const item of data) {
      const rec = asRecord(item);
      if (Array.isArray(rec.groups)) {
        for (const g of rec.groups) {
          const gRec = asRecord(g);
          groups.push({
            id: asNumber(gRec.id),
            name: asString(gRec.name),
            description: asString(gRec.description),
            is_active: Boolean(gRec.is_active),
          });
        }
      } else if (rec.id !== undefined && (rec.name !== undefined || rec.lab_group_name !== undefined)) {
        groups.push({
          id: asNumber(rec.id),
          name: asString(rec.name || rec.lab_group_name),
          description: asString(rec.description),
        });
      }
    }
    if (groups.length > 0) return groups;
  }

  // Fallback for flat array or paginated results
  const dataRec = asRecord(data);
  const list = asArray(dataRec.results || data);
  return list.map((item) => {
    const rec = asRecord(item);
    return {
      id: asNumber(rec.id),
      name: asString(rec.name || rec.lab_group_name),
      description: asString(rec.description),
      is_active: Boolean(rec.is_active),
    };
  });
}

/** Legacy alias */
export const mapDashboardLabGroups = (dto: unknown) => {
  const groups = mapBenchGroupsResponse(dto as LabsBenchGroupsRetrieveApiResponse);
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    lab_group_name: g.name,
  }));
};

// ─── Map Bench Detail ─────────────────────────────────────────────────────────

/** Location relations (`station`, `room`, `building`, each `{id, name}`) read into the flat view fields. */
function locationRelations(location: Record<string, unknown>) {
  const station = asRecord(location.station);
  const room = asRecord(location.room);
  const building = asRecord(location.building);
  return {
    station_id: station.id != null ? asNumber(station.id) : null,
    station_name: asNullableString(station.name),
    room_id: room.id != null ? asNumber(room.id) : null,
    room_name: asNullableString(room.name),
    building_name: asNullableString(building.name),
  };
}

function extractEquipmentDetail(categories: unknown[]): LabEquipmentDetail | null {
  const categoryGroups = asArray(categories);
  if (categoryGroups.length === 0) return null;

  let computer: LabEquipmentDetail['computer'] = null;
  let rack: LabEquipmentDetail['rack'] = null;
  const samplesList: LabEquipmentDetail['samples_list'] = [];
  const licenseList: LabEquipmentDetail['license_list'] = [];
  const networkInterfaceList: LabEquipmentDetail['network_interface_list'] = [];
  const debugHardwareList: LabEquipmentDetail['debug_hardware_list'] = [];
  const powersupplyList: LabEquipmentDetail['powersupply_list'] = [];
  const monitorList: LabEquipmentDetail['monitor_list'] = [];
  const accessoryList: LabEquipmentDetail['accessory_list'] = [];

  for (const cat of categoryGroups) {
    const catRec = asRecord(cat);
    const catName = asString(catRec.name).toLowerCase();
    const equipment = asArray(catRec.equipment);

    for (const eq of equipment) {
      const eqRec = asRecord(eq);
      const id = asNumber(eqRec.id);
      const sku = asString(eqRec.sku);
      const name = asString(eqRec.name);

      if (catName.includes('computer')) {
        computer = { id, sku, computer_name: name };
      } else if (catName.includes('rack')) {
        rack = { id, sku, name };
      } else if (catName.includes('sample')) {
        samplesList.push({ id, sku, name });
      } else if (catName.includes('license')) {
        licenseList.push({ id, sku, license_name: name });
      } else if (catName.includes('network') || catName.includes('nic')) {
        networkInterfaceList.push({ id, sku, network_interface_name: name });
      } else if (catName.includes('debug')) {
        debugHardwareList.push({ id, sku, debug_hardware_name: name });
      } else if (catName.includes('power')) {
        powersupplyList.push({ id, sku, powersupply_name: name });
      } else if (catName.includes('monitor')) {
        monitorList.push({ id, sku, monitor_name: name });
      } else {
        accessoryList.push({ id, sku, accessory_name: name });
      }
    }
  }

  return {
    id: 0,
    computer,
    rack,
    samples_list: samplesList,
    license_list: licenseList,
    network_interface_list: networkInterfaceList,
    debug_hardware_list: debugHardwareList,
    powersupply_list: powersupplyList,
    monitor_list: monitorList,
    accessory_list: accessoryList,
  };
}

export function mapBenchDetailResponse(
  dto: LabsDashboardBenchesRetrieveByBenchIdApiResponse | RecordValue,
): DashboardBenchDetail {
  const envelope = asRecord(dto);
  let source = asRecord(envelope.data);
  if (source.id === undefined && source.data !== undefined) {
    source = asRecord(source.data);
  }

  const group = source.bench_group ? asRecord(source.bench_group) : null;
  const benchType = source.bench_type ? asRecord(source.bench_type) : null;
  const location = source.location ? asRecord(source.location) : null;
  const currentBooking = source.current_booking ? asRecord(source.current_booking) : null;
  const computing = source.computing ? asRecord(source.computing) : null;
  const equipmentByCategory = asArray(source.equipment_by_category);
  const upcomingBookings = asArray(source.upcoming_bookings);

  const name = asString(source.name || source.lab_name);
  const roomName = location ? asString(asRecord(location.room).name) : '';
  const stationName = location ? asString(asRecord(location.station).name) : '';
  const locationName = [roomName, stationName].filter(Boolean).join(' - ');

  const labEquipment =
    source.lab_equipment != null
      ? (source.lab_equipment as LabEquipmentDetail)
      : extractEquipmentDetail(equipmentByCategory);

  const activityStatus = computing
    ? asString(computing.activity_status || computing.status)
    : '';

  return {
    id: asNumber(source.id),
    sku: asString(source.sku),
    name,
    lifecycle_status: asString(source.lifecycle_status),
    bench_group: group
      ? {
          id: asNumber(group.id),
          name: asString(group.name || group.lab_group_name),
          description: asString(group.description),
        }
      : null,
    bench_type: benchType
      ? {
          id: asNumber(benchType.id),
          name: asString(benchType.name),
        }
      : null,
    location: location
      ? {
          ...locationRelations(location),
          slot_label: asNullableString(location.slot_label),
        }
      : null,
    is_favorite: Boolean(source.is_favorite),
    current_booking: currentBooking
      ? {
          id: asNumber(currentBooking.id),
          booking_code: asString(currentBooking.booking_code),
          starts_at: asString(currentBooking.starts_at || currentBooking.from_date_time),
          ends_at: asString(currentBooking.ends_at || currentBooking.to_date_time),
          status: asString(currentBooking.status),
        }
      : null,
    computing: computing
      ? {
          id: asNumber(computing.id),
          sku: asString(computing.sku),
          name: asString(computing.name || computing.computer_name),
          activity_status: activityStatus,
          last_agent_report_at: asNullableString(computing.last_agent_report_at),
          is_stale: computing.is_stale != null ? Boolean(computing.is_stale) : null,
        }
      : null,
    samples: asArray(source.samples).map((s) => {
      const rec = asRecord(s);
      return { id: asNumber(rec.id), sku: asString(rec.sku), name: asString(rec.name) };
    }),
    licenses: asArray(source.licenses).map((l) => {
      const rec = asRecord(l);
      return { id: asNumber(rec.id), sku: asString(rec.sku), name: asString(rec.name) };
    }),
    assigned_equipment_count: asNumber(source.assigned_equipment_count),
    image_url: asNullableString(source.image_url || source.image),
    updated_at: asString(source.updated_at),
    description: asString(source.description || source.remark),
    documentation_url: asString(source.documentation_url || source.location_url),
    criticality: asString(source.criticality),
    equipment_by_category: equipmentByCategory.map((cat) => {
      const catRec = asRecord(cat);
      return {
        id: catRec.id != null ? asNumber(catRec.id) : null,
        name: asString(catRec.name),
        equipment: asArray(catRec.equipment).map((eq) => {
          const eqRec = asRecord(eq);
          const eqCat = eqRec.category ? asRecord(eqRec.category) : null;
          const computingAct = eqRec.computing_activity
            ? asRecord(eqRec.computing_activity)
            : null;
          return {
            id: asNumber(eqRec.id),
            sku: asString(eqRec.sku),
            name: asString(eqRec.name),
            category: eqCat
              ? { id: asNumber(eqCat.id), name: asString(eqCat.name) }
              : null,
            role: asString(eqRec.role),
            position: asNumber(eqRec.position),
            assigned_at: asString(eqRec.assigned_at),
            computing_activity: computingAct
              ? {
                  status: asString(computingAct.status),
                  last_agent_report_at: asNullableString(computingAct.last_agent_report_at),
                  is_stale: computingAct.is_stale != null ? Boolean(computingAct.is_stale) : null,
                }
              : null,
            licenses: asArray(eqRec.licenses).map((lic) => {
              const licRec = asRecord(lic);
              return { id: asNumber(licRec.id), sku: asString(licRec.sku), name: asString(licRec.name) };
            }),
          };
        }),
      };
    }),
    upcoming_bookings: upcomingBookings.map((b) => {
      const bRec = asRecord(b);
      return {
        id: asNumber(bRec.id),
        booking_code: asString(bRec.booking_code),
        starts_at: asString(bRec.starts_at),
        ends_at: asString(bRec.ends_at),
        status: asString(bRec.status),
      };
    }),

    // Compatibility fields
    lab_name: name,
    location_name: locationName,
    location_url: asString(source.documentation_url || source.location_url),
    image: asNullableString(source.image_url || source.image),
    remark: asString(source.description || source.remark),
    lab_group: group
      ? {
          id: asNumber(group.id),
          lab_group_name: asString(group.name || group.lab_group_name),
        }
      : null,
    technical_user: source.technical_user
      ? (() => {
          const u = asRecord(source.technical_user);
          return {
            id: asNumber(u.id),
            first_name: asString(u.first_name),
            last_name: asString(u.last_name),
            email: asString(u.email),
            username: asString(u.username),
          };
        })()
      : null,
    primary_owner: source.primary_owner
      ? (() => {
          const o = asRecord(source.primary_owner);
          return {
            id: asNumber(o.id),
            username: asString(o.name),
            display_name: asString(o.name),
          };
        })()
      : null,
    computer: computing
      ? {
          id: asNumber(computing.id),
          computer_ip: asString(computing.ip_address || computing.computer_ip),
          computer_name: asString(computing.name || computing.computer_name),
          status: activityStatus,
          rdp_file: asString(computing.rdp_file_url || computing.rdp_file) || undefined,
        }
      : null,
    lab_equipment: labEquipment,
    current_activity: computing
      ? {
          id: asNumber(computing.id),
          status: activityStatus,
          inactive_time: null,
          offline_time: null,
          booking_code: currentBooking ? asString(currentBooking.booking_code) : null,
          remote_user: asNullableString(computing.remote_user),
          remote_user_displayname: asNullableString(computing.remote_user_display_name),
          remote_computer: asNullableString(computing.name),
          remote_ip: asNullableString(computing.remote_ip),
          source: null,
          created: asString(computing.last_agent_report_at),
          modified: asString(computing.last_agent_report_at),
        }
      : null,
    booking_status: {
      is_booked: Boolean(currentBooking),
      booking_info: currentBooking
        ? {
            id: asNumber(currentBooking.id),
            booking_code: asString(currentBooking.booking_code),
            from_date_time: asString(currentBooking.starts_at),
            to_date_time: asString(currentBooking.ends_at),
            status: asString(currentBooking.status),
            creator: { id: 0, username: '' },
          }
        : null,
    },
  };
}

/** Legacy alias */
export const mapLabDetailResponse = (dto: unknown) =>
  mapBenchDetailResponse(dto as LabsDashboardBenchesRetrieveByBenchIdApiResponse);

// ─── Map Favorite Response ────────────────────────────────────────────────────

export function mapFavoriteResponse(
  dto: LabsBenchesActionsFavoriteCreateByBenchIdApiResponse | RecordValue,
): { data: { is_favorite: boolean } } {
  const envelope = asRecord(dto);
  const data = asRecord(envelope.data);
  return {
    data: {
      is_favorite: Boolean(data.is_favorite ?? envelope.is_favorite ?? true),
    },
  };
}
