import { baseApi as api } from "@/shared/lib/api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    agentCheckInBooking: build.mutation<
      AgentCheckInBookingApiResponse,
      AgentCheckInBookingApiArg
    >({
      query: (queryArg) => ({
        url: `/agent/bookings/actions/check-in`,
        method: "POST",
        body: queryArg.agentBookingValidationRequest,
      }),
    }),
    agentCompleteBooking: build.mutation<
      AgentCompleteBookingApiResponse,
      AgentCompleteBookingApiArg
    >({
      query: (queryArg) => ({
        url: `/agent/bookings/actions/complete`,
        method: "POST",
        body: queryArg.agentBookingValidationRequest,
      }),
    }),
    agentExtendBooking: build.mutation<
      AgentExtendBookingApiResponse,
      AgentExtendBookingApiArg
    >({
      query: (queryArg) => ({
        url: `/agent/bookings/actions/extend`,
        method: "POST",
        body: queryArg.agentBookingExtendRequest,
      }),
    }),
    agentValidateBooking: build.mutation<
      AgentValidateBookingApiResponse,
      AgentValidateBookingApiArg
    >({
      query: (queryArg) => ({
        url: `/agent/bookings/actions/validate`,
        method: "POST",
        body: queryArg.agentBookingValidationRequest,
      }),
    }),
    agentDeviceObservationsActionsReportCreate: build.mutation<
      AgentDeviceObservationsActionsReportCreateApiResponse,
      AgentDeviceObservationsActionsReportCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/agent/device-observations/actions/report`,
        method: "POST",
        body: queryArg.deviceObservationReport,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    enrollAgent: build.mutation<EnrollAgentApiResponse, EnrollAgentApiArg>({
      query: (queryArg) => ({
        url: `/agent/enrollments`,
        method: "POST",
        body: queryArg.enrollAgentRequest,
      }),
    }),
    agentReportActivity: build.mutation<
      AgentReportActivityApiResponse,
      AgentReportActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/agent/equipment/activity`,
        method: "PATCH",
        body: queryArg.patchedAgentActivityReport,
      }),
    }),
    agentHeartbeat: build.mutation<
      AgentHeartbeatApiResponse,
      AgentHeartbeatApiArg
    >({
      query: (queryArg) => ({
        url: `/agent/heartbeat`,
        method: "POST",
        body: queryArg.agentHeartbeatRequest,
      }),
    }),
    getAgentInfo: build.query<GetAgentInfoApiResponse, GetAgentInfoApiArg>({
      query: () => ({ url: `/agent/info` }),
    }),
    agentMonitoringPolicyRetrieve: build.query<
      AgentMonitoringPolicyRetrieveApiResponse,
      AgentMonitoringPolicyRetrieveApiArg
    >({
      query: () => ({ url: `/agent/monitoring-policy` }),
    }),
    agentRecordSessionLog: build.mutation<
      AgentRecordSessionLogApiResponse,
      AgentRecordSessionLogApiArg
    >({
      query: (queryArg) => ({
        url: `/agent/session-logs`,
        method: "POST",
        body: queryArg.agentSessionLogReport,
      }),
    }),
    aadLoginCreate: build.mutation<
      AadLoginCreateApiResponse,
      AadLoginCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/aad-login`,
        method: "POST",
        body: queryArg.aadLogin,
      }),
    }),
    listAgents: build.query<ListAgentsApiResponse, ListAgentsApiArg>({
      query: (queryArg) => ({
        url: `/api/agents`,
        params: {
          equipment: queryArg.equipment,
          equipment_uid: queryArg.equipmentUid,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          state: queryArg.state,
        },
      }),
    }),
    createAgentGrant: build.mutation<
      CreateAgentGrantApiResponse,
      CreateAgentGrantApiArg
    >({
      query: (queryArg) => ({
        url: `/api/agents`,
        method: "POST",
        body: queryArg.createAgentGrantRequest,
      }),
    }),
    getAgentDetail: build.query<
      GetAgentDetailApiResponse,
      GetAgentDetailApiArg
    >({
      query: (queryArg) => ({ url: `/api/agents/${queryArg.id}` }),
    }),
    decommissionAgent: build.mutation<
      DecommissionAgentApiResponse,
      DecommissionAgentApiArg
    >({
      query: (queryArg) => ({
        url: `/api/agents/${queryArg.id}/actions/decommission`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    revokeAgent: build.mutation<RevokeAgentApiResponse, RevokeAgentApiArg>({
      query: (queryArg) => ({
        url: `/api/agents/${queryArg.id}/actions/revoke`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    listAgentGrants: build.query<
      ListAgentGrantsApiResponse,
      ListAgentGrantsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/agents/${queryArg.id}/enrollment-grants`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    createAgentRecoveryGrant: build.mutation<
      CreateAgentRecoveryGrantApiResponse,
      CreateAgentRecoveryGrantApiArg
    >({
      query: (queryArg) => ({
        url: `/api/agents/${queryArg.id}/enrollment-grants`,
        method: "POST",
        body: queryArg.createGrantForAgentRequest,
      }),
    }),
    revokeAgentGrant: build.mutation<
      RevokeAgentGrantApiResponse,
      RevokeAgentGrantApiArg
    >({
      query: (queryArg) => ({
        url: `/api/agents/${queryArg.id}/enrollment-grants/${queryArg.grantId}/actions/revoke`,
        method: "POST",
      }),
    }),
    csrfTokenRetrieve: build.query<
      CsrfTokenRetrieveApiResponse,
      CsrfTokenRetrieveApiArg
    >({
      query: () => ({ url: `/api/csrf-token` }),
    }),
    labsAnalyticsBenchGroupRetrieve: build.query<
      LabsAnalyticsBenchGroupRetrieveApiResponse,
      LabsAnalyticsBenchGroupRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/analytics/bench-group` }),
    }),
    labsAnalyticsBookedVsUsedRetrieve: build.query<
      LabsAnalyticsBookedVsUsedRetrieveApiResponse,
      LabsAnalyticsBookedVsUsedRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/booked-vs-used`,
        params: {
          from_date_time: queryArg.fromDateTime,
          to_date_time: queryArg.toDateTime,
        },
      }),
    }),
    labsAnalyticsBookingRetrieve: build.query<
      LabsAnalyticsBookingRetrieveApiResponse,
      LabsAnalyticsBookingRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/booking`,
        params: {
          date_after: queryArg.dateAfter,
          date_before: queryArg.dateBefore,
          unit: queryArg.unit,
        },
      }),
    }),
    labsAnalyticsEquipmentAvailabilityRetrieve: build.query<
      LabsAnalyticsEquipmentAvailabilityRetrieveApiResponse,
      LabsAnalyticsEquipmentAvailabilityRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/equipment-availability`,
        params: {
          from_date_time: queryArg.fromDateTime,
          to_date_time: queryArg.toDateTime,
        },
      }),
    }),
    labsAnalyticsFinanceExpenseTypeBreakdownRetrieve: build.query<
      LabsAnalyticsFinanceExpenseTypeBreakdownRetrieveApiResponse,
      LabsAnalyticsFinanceExpenseTypeBreakdownRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/finance/expense-type-breakdown`,
        params: {
          currency: queryArg.currency,
          end_month: queryArg.endMonth,
          start_month: queryArg.startMonth,
          timezone: queryArg.timezone,
        },
      }),
    }),
    labsAnalyticsFinanceMonthlyTrendsRetrieve: build.query<
      LabsAnalyticsFinanceMonthlyTrendsRetrieveApiResponse,
      LabsAnalyticsFinanceMonthlyTrendsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/finance/monthly-trends`,
        params: {
          currency: queryArg.currency,
          end_month: queryArg.endMonth,
          start_month: queryArg.startMonth,
          timezone: queryArg.timezone,
        },
      }),
    }),
    labsAnalyticsFinanceSummaryRetrieve: build.query<
      LabsAnalyticsFinanceSummaryRetrieveApiResponse,
      LabsAnalyticsFinanceSummaryRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/finance/summary`,
        params: {
          currency: queryArg.currency,
          end_month: queryArg.endMonth,
          start_month: queryArg.startMonth,
          timezone: queryArg.timezone,
        },
      }),
    }),
    labsAnalyticsLabCountRetrieve: build.query<
      LabsAnalyticsLabCountRetrieveApiResponse,
      LabsAnalyticsLabCountRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/lab-count`,
        params: {
          date_after: queryArg.dateAfter,
          date_before: queryArg.dateBefore,
          unit: queryArg.unit,
        },
      }),
    }),
    labsAnalyticsLabEfficiencyRetrieve: build.query<
      LabsAnalyticsLabEfficiencyRetrieveApiResponse,
      LabsAnalyticsLabEfficiencyRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/lab-efficiency`,
        params: {
          from_date_time: queryArg.fromDateTime,
          order: queryArg.order,
          to_date_time: queryArg.toDateTime,
          top: queryArg.top,
        },
      }),
    }),
    labsAnalyticsLabEquipmentStatusRetrieve: build.query<
      LabsAnalyticsLabEquipmentStatusRetrieveApiResponse,
      LabsAnalyticsLabEquipmentStatusRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/analytics/lab-equipment-status` }),
    }),
    labsAnalyticsLabUsageByTimeframeRetrieve: build.query<
      LabsAnalyticsLabUsageByTimeframeRetrieveApiResponse,
      LabsAnalyticsLabUsageByTimeframeRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/lab-usage-by-timeframe`,
        params: {
          from_date_time: queryArg.fromDateTime,
          to_date_time: queryArg.toDateTime,
        },
      }),
    }),
    labsAnalyticsLabVisitsRetrieve: build.query<
      LabsAnalyticsLabVisitsRetrieveApiResponse,
      LabsAnalyticsLabVisitsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/lab-visits`,
        params: {
          date_after: queryArg.dateAfter,
          date_before: queryArg.dateBefore,
          unit: queryArg.unit,
        },
      }),
    }),
    labsAnalyticsLabVisitsCreate: build.mutation<
      LabsAnalyticsLabVisitsCreateApiResponse,
      LabsAnalyticsLabVisitsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/lab-visits`,
        method: "POST",
        body: queryArg.labVisitLogCreate,
      }),
    }),
    labsAnalyticsProjectUsageRetrieve: build.query<
      LabsAnalyticsProjectUsageRetrieveApiResponse,
      LabsAnalyticsProjectUsageRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/project-usage`,
        params: {
          from_date_time: queryArg.fromDateTime,
          order: queryArg.order,
          to_date_time: queryArg.toDateTime,
          top: queryArg.top,
        },
      }),
    }),
    labsAnalyticsStorageQuotaRetrieve: build.query<
      LabsAnalyticsStorageQuotaRetrieveApiResponse,
      LabsAnalyticsStorageQuotaRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/storage-quota`,
        params: {
          log_date: queryArg.logDate,
          top: queryArg.top,
        },
      }),
    }),
    labsAnalyticsStorageQuotaCreate: build.mutation<
      LabsAnalyticsStorageQuotaCreateApiResponse,
      LabsAnalyticsStorageQuotaCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/storage-quota`,
        method: "POST",
        body: queryArg.storageQuotaCreate,
      }),
    }),
    labsAnalyticsUserBookingEfficiencyRetrieve: build.query<
      LabsAnalyticsUserBookingEfficiencyRetrieveApiResponse,
      LabsAnalyticsUserBookingEfficiencyRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/user-booking-efficiency`,
        params: {
          from_date_time: queryArg.fromDateTime,
          order: queryArg.order,
          to_date_time: queryArg.toDateTime,
          top: queryArg.top,
        },
      }),
    }),
    labsAnalyticsUserCountRetrieve: build.query<
      LabsAnalyticsUserCountRetrieveApiResponse,
      LabsAnalyticsUserCountRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/user-count`,
        params: {
          date_after: queryArg.dateAfter,
          date_before: queryArg.dateBefore,
          unit: queryArg.unit,
        },
      }),
    }),
    labsAnalyticsUserLabUsageRetrieve: build.query<
      LabsAnalyticsUserLabUsageRetrieveApiResponse,
      LabsAnalyticsUserLabUsageRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/analytics/user-lab-usage`,
        params: {
          from_date_time: queryArg.fromDateTime,
          order: queryArg.order,
          to_date_time: queryArg.toDateTime,
          top: queryArg.top,
        },
      }),
    }),
    labsAuditCatalogRetrieve: build.query<
      LabsAuditCatalogRetrieveApiResponse,
      LabsAuditCatalogRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/audit-catalog`,
        params: {
          changed_since: queryArg.changedSince,
          cursor: queryArg.cursor,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsAuditsRetrieve: build.query<
      LabsAuditsRetrieveApiResponse,
      LabsAuditsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/audits`,
        params: {
          auditor_id: queryArg.auditorId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          resource_type: queryArg.resourceType,
          result: queryArg.result,
        },
      }),
    }),
    labsAuditsRetrieveByAuditId: build.query<
      LabsAuditsRetrieveByAuditIdApiResponse,
      LabsAuditsRetrieveByAuditIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/labs/audits/${queryArg.auditId}` }),
    }),
    labsAuditsPartialUpdateByAuditId: build.mutation<
      LabsAuditsPartialUpdateByAuditIdApiResponse,
      LabsAuditsPartialUpdateByAuditIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/audits/${queryArg.auditId}`,
        method: "PATCH",
        body: queryArg.patchedUpdateResourceAuditRequest,
      }),
    }),
    labsAuditsDestroyByAuditId: build.mutation<
      LabsAuditsDestroyByAuditIdApiResponse,
      LabsAuditsDestroyByAuditIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/audits/${queryArg.auditId}`,
        method: "DELETE",
      }),
    }),
    labsBenchBookingsRetrieve: build.query<
      LabsBenchBookingsRetrieveApiResponse,
      LabsBenchBookingsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings`,
        params: {
          approval_status: queryArg.approvalStatus,
          bench_id: queryArg.benchId,
          booking_code: queryArg.bookingCode,
          creator: queryArg.creator,
          creator_id: queryArg.creatorId,
          ordering: queryArg.ordering,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          project_id: queryArg.projectId,
          q: queryArg.q,
          starts_at_after: queryArg.startsAtAfter,
          starts_at_before: queryArg.startsAtBefore,
          status: queryArg.status,
          view_side: queryArg.viewSide,
        },
      }),
    }),
    labsBenchBookingsCreate: build.mutation<
      LabsBenchBookingsCreateApiResponse,
      LabsBenchBookingsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings`,
        method: "POST",
        body: queryArg.benchBookingCreate,
      }),
    }),
    labsBenchBookingsRetrieveByBookingId: build.query<
      LabsBenchBookingsRetrieveByBookingIdApiResponse,
      LabsBenchBookingsRetrieveByBookingIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/${queryArg.bookingId}`,
      }),
    }),
    labsBenchBookingsPartialUpdateByBookingId: build.mutation<
      LabsBenchBookingsPartialUpdateByBookingIdApiResponse,
      LabsBenchBookingsPartialUpdateByBookingIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/${queryArg.bookingId}`,
        method: "PATCH",
        body: queryArg.patchedBenchBookingUpdate,
      }),
    }),
    labsBenchBookingsActionsApproveCreateByBookingId: build.mutation<
      LabsBenchBookingsActionsApproveCreateByBookingIdApiResponse,
      LabsBenchBookingsActionsApproveCreateByBookingIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/${queryArg.bookingId}/actions/approve`,
        method: "POST",
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsBenchBookingsActionsCancelCreateByBookingId: build.mutation<
      LabsBenchBookingsActionsCancelCreateByBookingIdApiResponse,
      LabsBenchBookingsActionsCancelCreateByBookingIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/${queryArg.bookingId}/actions/cancel`,
        method: "POST",
        body: queryArg.benchBookingCancelAction,
      }),
    }),
    labsBenchBookingsActionsCompleteCreateByBookingId: build.mutation<
      LabsBenchBookingsActionsCompleteCreateByBookingIdApiResponse,
      LabsBenchBookingsActionsCompleteCreateByBookingIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/${queryArg.bookingId}/actions/complete`,
        method: "POST",
      }),
    }),
    labsBenchBookingsActionsRejectCreateByBookingId: build.mutation<
      LabsBenchBookingsActionsRejectCreateByBookingIdApiResponse,
      LabsBenchBookingsActionsRejectCreateByBookingIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/${queryArg.bookingId}/actions/reject`,
        method: "POST",
        body: queryArg.benchBookingRejectAction,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsBenchBookingsCodeRetrieveByBookingCode: build.query<
      LabsBenchBookingsCodeRetrieveByBookingCodeApiResponse,
      LabsBenchBookingsCodeRetrieveByBookingCodeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/code/${queryArg.bookingCode}`,
      }),
    }),
    labsBenchBookingsCodePartialUpdateByBookingCode: build.mutation<
      LabsBenchBookingsCodePartialUpdateByBookingCodeApiResponse,
      LabsBenchBookingsCodePartialUpdateByBookingCodeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/code/${queryArg.bookingCode}`,
        method: "PATCH",
        body: queryArg.patchedBenchBookingUpdate,
      }),
    }),
    labsBenchBookingsCodeActionsCancelCreateByBookingCode: build.mutation<
      LabsBenchBookingsCodeActionsCancelCreateByBookingCodeApiResponse,
      LabsBenchBookingsCodeActionsCancelCreateByBookingCodeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/code/${queryArg.bookingCode}/actions/cancel`,
        method: "POST",
        body: queryArg.benchBookingCancelAction,
      }),
    }),
    labsBenchBookingsReferenceDataProjectsRetrieve: build.query<
      LabsBenchBookingsReferenceDataProjectsRetrieveApiResponse,
      LabsBenchBookingsReferenceDataProjectsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/reference-data/projects`,
        params: {
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsBenchBookingsReferenceDataProjectsCreate: build.mutation<
      LabsBenchBookingsReferenceDataProjectsCreateApiResponse,
      LabsBenchBookingsReferenceDataProjectsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/reference-data/projects`,
        method: "POST",
        body: queryArg.labProjectCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsBenchBookingsReferenceDataProjectsRetrieveByReferenceId: build.query<
      LabsBenchBookingsReferenceDataProjectsRetrieveByReferenceIdApiResponse,
      LabsBenchBookingsReferenceDataProjectsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-bookings/reference-data/projects/${queryArg.referenceId}`,
      }),
    }),
    labsBenchGroupsRetrieve: build.query<
      LabsBenchGroupsRetrieveApiResponse,
      LabsBenchGroupsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-groups`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsBenchGroupsCreate: build.mutation<
      LabsBenchGroupsCreateApiResponse,
      LabsBenchGroupsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-groups`,
        method: "POST",
        body: queryArg.benchReferenceWrite,
      }),
    }),
    labsBenchGroupsRetrieveByReferenceId: build.query<
      LabsBenchGroupsRetrieveByReferenceIdApiResponse,
      LabsBenchGroupsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-groups/${queryArg.referenceId}`,
      }),
    }),
    labsBenchGroupsPartialUpdateByReferenceId: build.mutation<
      LabsBenchGroupsPartialUpdateByReferenceIdApiResponse,
      LabsBenchGroupsPartialUpdateByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-groups/${queryArg.referenceId}`,
        method: "PATCH",
        body: queryArg.patchedBenchReferenceWrite,
      }),
    }),
    labsBenchGroupsDestroyByReferenceId: build.mutation<
      LabsBenchGroupsDestroyByReferenceIdApiResponse,
      LabsBenchGroupsDestroyByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-groups/${queryArg.referenceId}`,
        method: "DELETE",
      }),
    }),
    labsBenchGroupsOptionsRetrieve: build.query<
      LabsBenchGroupsOptionsRetrieveApiResponse,
      LabsBenchGroupsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-groups/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsBenchTypesRetrieve: build.query<
      LabsBenchTypesRetrieveApiResponse,
      LabsBenchTypesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-types`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsBenchTypesCreate: build.mutation<
      LabsBenchTypesCreateApiResponse,
      LabsBenchTypesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-types`,
        method: "POST",
        body: queryArg.benchReferenceWrite,
      }),
    }),
    labsBenchTypesRetrieveByReferenceId: build.query<
      LabsBenchTypesRetrieveByReferenceIdApiResponse,
      LabsBenchTypesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-types/${queryArg.referenceId}`,
      }),
    }),
    labsBenchTypesPartialUpdateByReferenceId: build.mutation<
      LabsBenchTypesPartialUpdateByReferenceIdApiResponse,
      LabsBenchTypesPartialUpdateByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-types/${queryArg.referenceId}`,
        method: "PATCH",
        body: queryArg.patchedBenchReferenceWrite,
      }),
    }),
    labsBenchTypesDestroyByReferenceId: build.mutation<
      LabsBenchTypesDestroyByReferenceIdApiResponse,
      LabsBenchTypesDestroyByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-types/${queryArg.referenceId}`,
        method: "DELETE",
      }),
    }),
    labsBenchTypesOptionsRetrieve: build.query<
      LabsBenchTypesOptionsRetrieveApiResponse,
      LabsBenchTypesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/bench-types/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsBenchesRetrieve: build.query<
      LabsBenchesRetrieveApiResponse,
      LabsBenchesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches`,
        params: {
          activity_status: queryArg.activityStatus,
          bench_group_id: queryArg.benchGroupId,
          condition: queryArg.condition,
          created_at_after: queryArg.createdAtAfter,
          created_at_before: queryArg.createdAtBefore,
          favorite: queryArg.favorite,
          group_id: queryArg.groupId,
          id: queryArg.id,
          lifecycle_status: queryArg.lifecycleStatus,
          ordering: queryArg.ordering,
          owner_id: queryArg.ownerId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          setup_location_id: queryArg.setupLocationId,
          status: queryArg.status,
          type_id: queryArg.typeId,
        },
      }),
    }),
    labsBenchesCreate: build.mutation<
      LabsBenchesCreateApiResponse,
      LabsBenchesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches`,
        method: "POST",
        body: queryArg.benchCreate,
      }),
    }),
    labsBenchesRetrieveByBenchId: build.query<
      LabsBenchesRetrieveByBenchIdApiResponse,
      LabsBenchesRetrieveByBenchIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/labs/benches/${queryArg.benchId}` }),
    }),
    labsBenchesUpdateByBenchId: build.mutation<
      LabsBenchesUpdateByBenchIdApiResponse,
      LabsBenchesUpdateByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}`,
        method: "PUT",
        body: queryArg.benchUpdate,
      }),
    }),
    labsBenchesPartialUpdateByBenchId: build.mutation<
      LabsBenchesPartialUpdateByBenchIdApiResponse,
      LabsBenchesPartialUpdateByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}`,
        method: "PATCH",
        body: queryArg.patchedBenchUpdate,
      }),
    }),
    labsBenchesDestroyByBenchId: build.mutation<
      LabsBenchesDestroyByBenchIdApiResponse,
      LabsBenchesDestroyByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}`,
        method: "DELETE",
      }),
    }),
    labsBenchesActionsChangeLifecycleCreateByBenchId: build.mutation<
      LabsBenchesActionsChangeLifecycleCreateByBenchIdApiResponse,
      LabsBenchesActionsChangeLifecycleCreateByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}/actions/change-lifecycle`,
        method: "POST",
        body: queryArg.benchLifecycleWrite,
      }),
    }),
    labsBenchesActionsFavoriteCreateByBenchId: build.mutation<
      LabsBenchesActionsFavoriteCreateByBenchIdApiResponse,
      LabsBenchesActionsFavoriteCreateByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}/actions/favorite`,
        method: "POST",
      }),
    }),
    labsBenchesActionsFavoriteDestroyByBenchId: build.mutation<
      LabsBenchesActionsFavoriteDestroyByBenchIdApiResponse,
      LabsBenchesActionsFavoriteDestroyByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}/actions/favorite`,
        method: "DELETE",
      }),
    }),
    labsBenchesActionsPlaceCreateByBenchId: build.mutation<
      LabsBenchesActionsPlaceCreateByBenchIdApiResponse,
      LabsBenchesActionsPlaceCreateByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}/actions/place`,
        method: "POST",
        body: queryArg.benchPlacement,
      }),
    }),
    labsBenchesActionsPlacePartialUpdateByBenchId: build.mutation<
      LabsBenchesActionsPlacePartialUpdateByBenchIdApiResponse,
      LabsBenchesActionsPlacePartialUpdateByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}/actions/place`,
        method: "PATCH",
        body: queryArg.patchedBenchPlacement,
      }),
    }),
    labsBenchesEquipmentRetrieveByBenchId: build.query<
      LabsBenchesEquipmentRetrieveByBenchIdApiResponse,
      LabsBenchesEquipmentRetrieveByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}/equipment`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsBenchesImageRetrieveByBenchId: build.query<
      LabsBenchesImageRetrieveByBenchIdApiResponse,
      LabsBenchesImageRetrieveByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}/image`,
      }),
    }),
    labsBenchesImageUpdateByBenchId: build.mutation<
      LabsBenchesImageUpdateByBenchIdApiResponse,
      LabsBenchesImageUpdateByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}/image`,
        method: "PUT",
        body: queryArg.resourceImageUpload,
      }),
    }),
    labsBenchesImageDestroyByBenchId: build.mutation<
      LabsBenchesImageDestroyByBenchIdApiResponse,
      LabsBenchesImageDestroyByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.benchId}/image`,
        method: "DELETE",
      }),
    }),
    labsBenchesProfileRetrieveById: build.query<
      LabsBenchesProfileRetrieveByIdApiResponse,
      LabsBenchesProfileRetrieveByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.id}/profile`,
        params: {
          end_date: queryArg.endDate,
          start_date: queryArg.startDate,
        },
      }),
    }),
    labsBenchesWeeklyUsageRetrieveById: build.query<
      LabsBenchesWeeklyUsageRetrieveByIdApiResponse,
      LabsBenchesWeeklyUsageRetrieveByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.id}/weekly-usage`,
      }),
    }),
    labsBenchesMappingRetrieveByResourceId: build.query<
      LabsBenchesMappingRetrieveByResourceIdApiResponse,
      LabsBenchesMappingRetrieveByResourceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/${queryArg.resourceId}/mapping`,
        params: {
          benches_cursor: queryArg.benchesCursor,
          equipment_cursor: queryArg.equipmentCursor,
          license_assignments_cursor: queryArg.licenseAssignmentsCursor,
          licenses_cursor: queryArg.licensesCursor,
          page_size: queryArg.pageSize,
          room_slots_cursor: queryArg.roomSlotsCursor,
          rooms_cursor: queryArg.roomsCursor,
          station_slots_cursor: queryArg.stationSlotsCursor,
          stations_cursor: queryArg.stationsCursor,
        },
      }),
    }),
    labsBenchesBookingChoicesRetrieve: build.query<
      LabsBenchesBookingChoicesRetrieveApiResponse,
      LabsBenchesBookingChoicesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/booking-choices`,
        params: {
          has_computing: queryArg.hasComputing,
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsBenchesFiltersRetrieve: build.query<
      LabsBenchesFiltersRetrieveApiResponse,
      LabsBenchesFiltersRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/filters`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsBenchesOptionsRetrieve: build.query<
      LabsBenchesOptionsRetrieveApiResponse,
      LabsBenchesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/options`,
        params: {
          bench_group_id: queryArg.benchGroupId,
          favorite: queryArg.favorite,
          include_ids: queryArg.includeIds,
          lifecycle_status: queryArg.lifecycleStatus,
          q: queryArg.q,
          setup_location_id: queryArg.setupLocationId,
          type_id: queryArg.typeId,
        },
      }),
    }),
    labsBenchesReferenceDataRetrieve: build.query<
      LabsBenchesReferenceDataRetrieveApiResponse,
      LabsBenchesReferenceDataRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/benches/reference-data` }),
    }),
    labsBenchesReferenceDataGroupsRetrieve: build.query<
      LabsBenchesReferenceDataGroupsRetrieveApiResponse,
      LabsBenchesReferenceDataGroupsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/reference-data/groups`,
        params: {
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsBenchesReferenceDataGroupsCreate: build.mutation<
      LabsBenchesReferenceDataGroupsCreateApiResponse,
      LabsBenchesReferenceDataGroupsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/reference-data/groups`,
        method: "POST",
        body: queryArg.benchGroupCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsBenchesReferenceDataGroupsRetrieveByReferenceId: build.query<
      LabsBenchesReferenceDataGroupsRetrieveByReferenceIdApiResponse,
      LabsBenchesReferenceDataGroupsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/reference-data/groups/${queryArg.referenceId}`,
      }),
    }),
    labsBenchesReferenceDataTypesRetrieve: build.query<
      LabsBenchesReferenceDataTypesRetrieveApiResponse,
      LabsBenchesReferenceDataTypesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/reference-data/types`,
        params: {
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsBenchesReferenceDataTypesCreate: build.mutation<
      LabsBenchesReferenceDataTypesCreateApiResponse,
      LabsBenchesReferenceDataTypesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/reference-data/types`,
        method: "POST",
        body: queryArg.benchTypeCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsBenchesReferenceDataTypesRetrieveByReferenceId: build.query<
      LabsBenchesReferenceDataTypesRetrieveByReferenceIdApiResponse,
      LabsBenchesReferenceDataTypesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/benches/reference-data/types/${queryArg.referenceId}`,
      }),
    }),
    labsBenchesStatusSummaryRetrieve: build.query<
      LabsBenchesStatusSummaryRetrieveApiResponse,
      LabsBenchesStatusSummaryRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/benches/status-summary` }),
    }),
    labsBuildingsRetrieve: build.query<
      LabsBuildingsRetrieveApiResponse,
      LabsBuildingsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/buildings`,
        params: {
          city_id: queryArg.cityId,
          include_ids: queryArg.includeIds,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsBuildingsRetrieveByBuildingId: build.query<
      LabsBuildingsRetrieveByBuildingIdApiResponse,
      LabsBuildingsRetrieveByBuildingIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/buildings/${queryArg.buildingId}`,
      }),
    }),
    labsBuildingsOptionsRetrieve: build.query<
      LabsBuildingsOptionsRetrieveApiResponse,
      LabsBuildingsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/buildings/options`,
        params: {
          city_id: queryArg.cityId,
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsCitiesRetrieve: build.query<
      LabsCitiesRetrieveApiResponse,
      LabsCitiesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/cities`,
        params: {
          country_id: queryArg.countryId,
          include_ids: queryArg.includeIds,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsCitiesRetrieveByCityId: build.query<
      LabsCitiesRetrieveByCityIdApiResponse,
      LabsCitiesRetrieveByCityIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/labs/cities/${queryArg.cityId}` }),
    }),
    labsCitiesOptionsRetrieve: build.query<
      LabsCitiesOptionsRetrieveApiResponse,
      LabsCitiesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/cities/options`,
        params: {
          country_id: queryArg.countryId,
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsCountriesRetrieve: build.query<
      LabsCountriesRetrieveApiResponse,
      LabsCountriesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/countries`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsCountriesRetrieveByCountryId: build.query<
      LabsCountriesRetrieveByCountryIdApiResponse,
      LabsCountriesRetrieveByCountryIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/countries/${queryArg.countryId}`,
      }),
    }),
    labsCountriesOptionsRetrieve: build.query<
      LabsCountriesOptionsRetrieveApiResponse,
      LabsCountriesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/countries/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsDashboardRetrieve: build.query<
      LabsDashboardRetrieveApiResponse,
      LabsDashboardRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/dashboard`,
        params: {
          activity_status: queryArg.activityStatus,
          bench_group: queryArg.benchGroup,
          has_computing: queryArg.hasComputing,
          is_booked: queryArg.isBooked,
          is_favorite: queryArg.isFavorite,
          is_mapped: queryArg.isMapped,
          lifecycle_status: queryArg.lifecycleStatus,
          location: queryArg.location,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsDashboardBenchesRetrieveByBenchId: build.query<
      LabsDashboardBenchesRetrieveByBenchIdApiResponse,
      LabsDashboardBenchesRetrieveByBenchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/dashboard/benches/${queryArg.benchId}`,
      }),
    }),
    labsDashboardSummaryRetrieve: build.query<
      LabsDashboardSummaryRetrieveApiResponse,
      LabsDashboardSummaryRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/dashboard/summary` }),
    }),
    labsDepartmentsRetrieve: build.query<
      LabsDepartmentsRetrieveApiResponse,
      LabsDepartmentsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/departments`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsDepartmentsRetrieveByDepartmentId: build.query<
      LabsDepartmentsRetrieveByDepartmentIdApiResponse,
      LabsDepartmentsRetrieveByDepartmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/departments/${queryArg.departmentId}`,
      }),
    }),
    labsDepartmentsOptionsRetrieve: build.query<
      LabsDepartmentsOptionsRetrieveApiResponse,
      LabsDepartmentsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/departments/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsDeviceConnectionsRetrieve: build.query<
      LabsDeviceConnectionsRetrieveApiResponse,
      LabsDeviceConnectionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/device-connections`,
        params: {
          bench_id: queryArg.benchId,
          computing_id: queryArg.computingId,
          is_attention_required: queryArg.isAttentionRequired,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          state: queryArg.state,
        },
      }),
    }),
    labsDeviceConnectionsRetrieveByConnectionId: build.query<
      LabsDeviceConnectionsRetrieveByConnectionIdApiResponse,
      LabsDeviceConnectionsRetrieveByConnectionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/device-connections/${queryArg.connectionId}`,
      }),
    }),
    labsDeviceConnectionsActionsLinkCreateByConnectionId: build.mutation<
      LabsDeviceConnectionsActionsLinkCreateByConnectionIdApiResponse,
      LabsDeviceConnectionsActionsLinkCreateByConnectionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/device-connections/${queryArg.connectionId}/actions/link`,
        method: "POST",
        body: queryArg.linkDeviceConnectionRequest,
      }),
    }),
    labsDeviceConnectionsSummaryRetrieve: build.query<
      LabsDeviceConnectionsSummaryRetrieveApiResponse,
      LabsDeviceConnectionsSummaryRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/device-connections/summary`,
        params: {
          bench_id: queryArg.benchId,
        },
      }),
    }),
    labsDowntimesRetrieve: build.query<
      LabsDowntimesRetrieveApiResponse,
      LabsDowntimesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/downtimes`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          resource_id: queryArg.resourceId,
          resource_type: queryArg.resourceType,
          state: queryArg.state,
        },
      }),
    }),
    labsDowntimesCreate: build.mutation<
      LabsDowntimesCreateApiResponse,
      LabsDowntimesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/downtimes`,
        method: "POST",
        body: queryArg.downtimeCreate,
      }),
    }),
    labsDowntimesRetrieveByDowntimeId: build.query<
      LabsDowntimesRetrieveByDowntimeIdApiResponse,
      LabsDowntimesRetrieveByDowntimeIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/downtimes/${queryArg.downtimeId}`,
      }),
    }),
    labsDowntimesActionsCancelCreateByDowntimeId: build.mutation<
      LabsDowntimesActionsCancelCreateByDowntimeIdApiResponse,
      LabsDowntimesActionsCancelCreateByDowntimeIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/downtimes/${queryArg.downtimeId}/actions/cancel`,
        method: "POST",
      }),
    }),
    labsDowntimesActionsEndCreateByDowntimeId: build.mutation<
      LabsDowntimesActionsEndCreateByDowntimeIdApiResponse,
      LabsDowntimesActionsEndCreateByDowntimeIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/downtimes/${queryArg.downtimeId}/actions/end`,
        method: "POST",
      }),
    }),
    labsEquipmentRetrieve: build.query<
      LabsEquipmentRetrieveApiResponse,
      LabsEquipmentRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment`,
        params: {
          assigned: queryArg.assigned,
          category: queryArg.category,
          condition: queryArg.condition,
          created_at_after: queryArg.createdAtAfter,
          created_at_before: queryArg.createdAtBefore,
          customer_id: queryArg.customerId,
          department_id: queryArg.departmentId,
          group_id: queryArg.groupId,
          id: queryArg.id,
          kind: queryArg.kind,
          lifecycle_state: queryArg.lifecycleState,
          loan_overdue: queryArg.loanOverdue,
          manufacturer: queryArg.manufacturer,
          material_id: queryArg.materialId,
          on_loan: queryArg.onLoan,
          ordering: queryArg.ordering,
          owner_id: queryArg.ownerId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          product_model_id: queryArg.productModelId,
          protocol_id: queryArg.protocolId,
          q: queryArg.q,
          resolution_id: queryArg.resolutionId,
          size_id: queryArg.sizeId,
          status: queryArg.status,
          technical_user_id: queryArg.technicalUserId,
          type: queryArg["type"],
        },
      }),
    }),
    labsEquipmentCreate: build.mutation<
      LabsEquipmentCreateApiResponse,
      LabsEquipmentCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment`,
        method: "POST",
        body: queryArg.equipmentCreate,
      }),
    }),
    labsEquipmentCategoriesRetrieve: build.query<
      LabsEquipmentCategoriesRetrieveApiResponse,
      LabsEquipmentCategoriesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-categories`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsEquipmentCategoriesRetrieveByCategoryId: build.query<
      LabsEquipmentCategoriesRetrieveByCategoryIdApiResponse,
      LabsEquipmentCategoriesRetrieveByCategoryIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-categories/${queryArg.categoryId}`,
      }),
    }),
    labsEquipmentCategoriesOptionsRetrieve: build.query<
      LabsEquipmentCategoriesOptionsRetrieveApiResponse,
      LabsEquipmentCategoriesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-categories/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentKindsRetrieve: build.query<
      LabsEquipmentKindsRetrieveApiResponse,
      LabsEquipmentKindsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-kinds`,
        params: {
          category_id: queryArg.categoryId,
          include_ids: queryArg.includeIds,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentKindsRetrieveByKindId: build.query<
      LabsEquipmentKindsRetrieveByKindIdApiResponse,
      LabsEquipmentKindsRetrieveByKindIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-kinds/${queryArg.kindId}`,
      }),
    }),
    labsEquipmentKindsOptionsRetrieve: build.query<
      LabsEquipmentKindsOptionsRetrieveApiResponse,
      LabsEquipmentKindsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-kinds/options`,
        params: {
          category_id: queryArg.categoryId,
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentLoanBatchesRetrieveByBatchId: build.query<
      LabsEquipmentLoanBatchesRetrieveByBatchIdApiResponse,
      LabsEquipmentLoanBatchesRetrieveByBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-loan-batches/${queryArg.batchId}`,
      }),
    }),
    labsEquipmentLoansRetrieve: build.query<
      LabsEquipmentLoansRetrieveApiResponse,
      LabsEquipmentLoansRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-loans`,
        params: {
          batch_id: queryArg.batchId,
          borrower_id: queryArg.borrowerId,
          borrower_name: queryArg.borrowerName,
          equipment_id: queryArg.equipmentId,
          open: queryArg.open,
          overdue: queryArg.overdue,
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsEquipmentLoansCreate: build.mutation<
      LabsEquipmentLoansCreateApiResponse,
      LabsEquipmentLoansCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-loans`,
        method: "POST",
        body: queryArg.equipmentLendBatch,
      }),
    }),
    labsEquipmentLoansActionsExtendCreate: build.mutation<
      LabsEquipmentLoansActionsExtendCreateApiResponse,
      LabsEquipmentLoansActionsExtendCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-loans/actions/extend`,
        method: "POST",
        body: queryArg.equipmentExtendLoans,
      }),
    }),
    labsEquipmentLoansActionsReturnCreate: build.mutation<
      LabsEquipmentLoansActionsReturnCreateApiResponse,
      LabsEquipmentLoansActionsReturnCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-loans/actions/return`,
        method: "POST",
        body: queryArg.equipmentReturnBatch,
      }),
    }),
    labsEquipmentManufacturersRetrieve: build.query<
      LabsEquipmentManufacturersRetrieveApiResponse,
      LabsEquipmentManufacturersRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-manufacturers`,
        params: {
          category_id: queryArg.categoryId,
          include_ids: queryArg.includeIds,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentManufacturersRetrieveByManufacturerId: build.query<
      LabsEquipmentManufacturersRetrieveByManufacturerIdApiResponse,
      LabsEquipmentManufacturersRetrieveByManufacturerIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-manufacturers/${queryArg.manufacturerId}`,
      }),
    }),
    labsEquipmentManufacturersOptionsRetrieve: build.query<
      LabsEquipmentManufacturersOptionsRetrieveApiResponse,
      LabsEquipmentManufacturersOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-manufacturers/options`,
        params: {
          category_id: queryArg.categoryId,
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentProductModelsRetrieve: build.query<
      LabsEquipmentProductModelsRetrieveApiResponse,
      LabsEquipmentProductModelsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-product-models`,
        params: {
          include_ids: queryArg.includeIds,
          manufacturer_id: queryArg.manufacturerId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          type_id: queryArg.typeId,
        },
      }),
    }),
    labsEquipmentProductModelsRetrieveByModelId: build.query<
      LabsEquipmentProductModelsRetrieveByModelIdApiResponse,
      LabsEquipmentProductModelsRetrieveByModelIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-product-models/${queryArg.modelId}`,
      }),
    }),
    labsEquipmentProductModelsOptionsRetrieve: build.query<
      LabsEquipmentProductModelsOptionsRetrieveApiResponse,
      LabsEquipmentProductModelsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-product-models/options`,
        params: {
          include_ids: queryArg.includeIds,
          manufacturer_id: queryArg.manufacturerId,
          q: queryArg.q,
          type_id: queryArg.typeId,
        },
      }),
    }),
    labsEquipmentReservationsRetrieve: build.query<
      LabsEquipmentReservationsRetrieveApiResponse,
      LabsEquipmentReservationsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-reservations`,
        params: {
          batch_id: queryArg.batchId,
          borrower_name: queryArg.borrowerName,
          ends_after: queryArg.endsAfter,
          equipment_id: queryArg.equipmentId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          starts_before: queryArg.startsBefore,
          status: queryArg.status,
        },
      }),
    }),
    labsEquipmentReservationsCreate: build.mutation<
      LabsEquipmentReservationsCreateApiResponse,
      LabsEquipmentReservationsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-reservations`,
        method: "POST",
        body: queryArg.equipmentReserve,
      }),
    }),
    labsEquipmentReservationsRetrieveByBatchId: build.query<
      LabsEquipmentReservationsRetrieveByBatchIdApiResponse,
      LabsEquipmentReservationsRetrieveByBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-reservations/${queryArg.batchId}`,
      }),
    }),
    labsEquipmentReservationsPartialUpdateByBatchId: build.mutation<
      LabsEquipmentReservationsPartialUpdateByBatchIdApiResponse,
      LabsEquipmentReservationsPartialUpdateByBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-reservations/${queryArg.batchId}`,
        method: "PATCH",
        body: queryArg.patchedEquipmentReservationUpdate,
      }),
    }),
    labsEquipmentReservationsActionsCancelCreateByBatchId: build.mutation<
      LabsEquipmentReservationsActionsCancelCreateByBatchIdApiResponse,
      LabsEquipmentReservationsActionsCancelCreateByBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-reservations/${queryArg.batchId}/actions/cancel`,
        method: "POST",
        body: queryArg.equipmentReservationCancel,
      }),
    }),
    labsEquipmentReservationsActionsHandOverCreateByBatchId: build.mutation<
      LabsEquipmentReservationsActionsHandOverCreateByBatchIdApiResponse,
      LabsEquipmentReservationsActionsHandOverCreateByBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-reservations/${queryArg.batchId}/actions/hand-over`,
        method: "POST",
        body: queryArg.equipmentReservationHandOver,
      }),
    }),
    labsEquipmentTypesRetrieve: build.query<
      LabsEquipmentTypesRetrieveApiResponse,
      LabsEquipmentTypesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-types`,
        params: {
          category_id: queryArg.categoryId,
          include_ids: queryArg.includeIds,
          kind_id: queryArg.kindId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentTypesRetrieveByTypeId: build.query<
      LabsEquipmentTypesRetrieveByTypeIdApiResponse,
      LabsEquipmentTypesRetrieveByTypeIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-types/${queryArg.typeId}`,
      }),
    }),
    labsEquipmentTypesOptionsRetrieve: build.query<
      LabsEquipmentTypesOptionsRetrieveApiResponse,
      LabsEquipmentTypesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment-types/options`,
        params: {
          category_id: queryArg.categoryId,
          include_ids: queryArg.includeIds,
          kind_id: queryArg.kindId,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentActionsChangeConditionCreateByEquipmentId: build.mutation<
      LabsEquipmentActionsChangeConditionCreateByEquipmentIdApiResponse,
      LabsEquipmentActionsChangeConditionCreateByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/actions/change-condition`,
        method: "POST",
        body: queryArg.equipmentChangeCondition,
      }),
    }),
    labsEquipmentActionsChangeLifecycleCreateByEquipmentId: build.mutation<
      LabsEquipmentActionsChangeLifecycleCreateByEquipmentIdApiResponse,
      LabsEquipmentActionsChangeLifecycleCreateByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/actions/change-lifecycle`,
        method: "POST",
        body: queryArg.equipmentChangeLifecycle,
      }),
    }),
    labsEquipmentActionsExtendLoanCreateByEquipmentId: build.mutation<
      LabsEquipmentActionsExtendLoanCreateByEquipmentIdApiResponse,
      LabsEquipmentActionsExtendLoanCreateByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/actions/extend-loan`,
        method: "POST",
        body: queryArg.equipmentExtendLoan,
      }),
    }),
    labsEquipmentActionsHandOverCreateByEquipmentId: build.mutation<
      LabsEquipmentActionsHandOverCreateByEquipmentIdApiResponse,
      LabsEquipmentActionsHandOverCreateByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/actions/hand-over`,
        method: "POST",
        body: queryArg.equipmentHandOver,
      }),
    }),
    labsEquipmentActionsReturnCreateByEquipmentId: build.mutation<
      LabsEquipmentActionsReturnCreateByEquipmentIdApiResponse,
      LabsEquipmentActionsReturnCreateByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/actions/return`,
        method: "POST",
        body: queryArg.equipmentReturn,
      }),
    }),
    labsEquipmentActivityRetrieveByEquipmentId: build.query<
      LabsEquipmentActivityRetrieveByEquipmentIdApiResponse,
      LabsEquipmentActivityRetrieveByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/activity`,
      }),
    }),
    labsEquipmentAssignmentRetrieveByEquipmentId: build.query<
      LabsEquipmentAssignmentRetrieveByEquipmentIdApiResponse,
      LabsEquipmentAssignmentRetrieveByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/assignment`,
      }),
    }),
    labsEquipmentAssignmentUpdateByEquipmentId: build.mutation<
      LabsEquipmentAssignmentUpdateByEquipmentIdApiResponse,
      LabsEquipmentAssignmentUpdateByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/assignment`,
        method: "PUT",
        body: queryArg.equipmentAssignment,
      }),
    }),
    labsEquipmentAssignmentDestroyByEquipmentId: build.mutation<
      LabsEquipmentAssignmentDestroyByEquipmentIdApiResponse,
      LabsEquipmentAssignmentDestroyByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/assignment`,
        method: "DELETE",
      }),
    }),
    labsEquipmentHardwareIdsRetrieveByEquipmentId: build.query<
      LabsEquipmentHardwareIdsRetrieveByEquipmentIdApiResponse,
      LabsEquipmentHardwareIdsRetrieveByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/hardware-ids`,
      }),
    }),
    labsEquipmentHardwareIdsCreateByEquipmentId: build.mutation<
      LabsEquipmentHardwareIdsCreateByEquipmentIdApiResponse,
      LabsEquipmentHardwareIdsCreateByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/hardware-ids`,
        method: "POST",
        body: queryArg.registerHardwareIdRequest,
      }),
    }),
    labsEquipmentHardwareIdsDestroyByEquipmentIdHardwareIdId: build.mutation<
      LabsEquipmentHardwareIdsDestroyByEquipmentIdHardwareIdIdApiResponse,
      LabsEquipmentHardwareIdsDestroyByEquipmentIdHardwareIdIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/hardware-ids/${queryArg.hardwareIdId}`,
        method: "DELETE",
      }),
    }),
    labsEquipmentImageRetrieveByEquipmentId: build.query<
      LabsEquipmentImageRetrieveByEquipmentIdApiResponse,
      LabsEquipmentImageRetrieveByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/image`,
      }),
    }),
    labsEquipmentImageUpdateByEquipmentId: build.mutation<
      LabsEquipmentImageUpdateByEquipmentIdApiResponse,
      LabsEquipmentImageUpdateByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/image`,
        method: "PUT",
        body: queryArg.resourceImageUpload,
      }),
    }),
    labsEquipmentImageDestroyByEquipmentId: build.mutation<
      LabsEquipmentImageDestroyByEquipmentIdApiResponse,
      LabsEquipmentImageDestroyByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/image`,
        method: "DELETE",
      }),
    }),
    labsEquipmentLoanRetrieveByEquipmentId: build.query<
      LabsEquipmentLoanRetrieveByEquipmentIdApiResponse,
      LabsEquipmentLoanRetrieveByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/loan`,
      }),
    }),
    labsEquipmentPlacementRetrieveByEquipmentId: build.query<
      LabsEquipmentPlacementRetrieveByEquipmentIdApiResponse,
      LabsEquipmentPlacementRetrieveByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/placement`,
      }),
    }),
    labsEquipmentPlacementUpdateByEquipmentId: build.mutation<
      LabsEquipmentPlacementUpdateByEquipmentIdApiResponse,
      LabsEquipmentPlacementUpdateByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/placement`,
        method: "PUT",
        body: queryArg.equipmentPlacementWrite,
      }),
    }),
    labsEquipmentPlacementDestroyByEquipmentId: build.mutation<
      LabsEquipmentPlacementDestroyByEquipmentIdApiResponse,
      LabsEquipmentPlacementDestroyByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/placement`,
        method: "DELETE",
      }),
    }),
    labsEquipmentStatusChangesRetrieveByEquipmentId: build.query<
      LabsEquipmentStatusChangesRetrieveByEquipmentIdApiResponse,
      LabsEquipmentStatusChangesRetrieveByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.equipmentId}/status-changes`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsEquipmentRetrieveById: build.query<
      LabsEquipmentRetrieveByIdApiResponse,
      LabsEquipmentRetrieveByIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/labs/equipment/${queryArg.id}` }),
    }),
    labsEquipmentUpdateById: build.mutation<
      LabsEquipmentUpdateByIdApiResponse,
      LabsEquipmentUpdateByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.id}`,
        method: "PUT",
        body: queryArg.equipmentUpdate,
      }),
    }),
    labsEquipmentPartialUpdateById: build.mutation<
      LabsEquipmentPartialUpdateByIdApiResponse,
      LabsEquipmentPartialUpdateByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.id}`,
        method: "PATCH",
        body: queryArg.patchedEquipmentUpdate,
      }),
    }),
    labsEquipmentDestroyById: build.mutation<
      LabsEquipmentDestroyByIdApiResponse,
      LabsEquipmentDestroyByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.id}`,
        method: "DELETE",
      }),
    }),
    labsEquipmentMappingRetrieveByResourceId: build.query<
      LabsEquipmentMappingRetrieveByResourceIdApiResponse,
      LabsEquipmentMappingRetrieveByResourceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/${queryArg.resourceId}/mapping`,
        params: {
          benches_cursor: queryArg.benchesCursor,
          equipment_cursor: queryArg.equipmentCursor,
          license_assignments_cursor: queryArg.licenseAssignmentsCursor,
          licenses_cursor: queryArg.licensesCursor,
          page_size: queryArg.pageSize,
          room_slots_cursor: queryArg.roomSlotsCursor,
          rooms_cursor: queryArg.roomsCursor,
          station_slots_cursor: queryArg.stationSlotsCursor,
          stations_cursor: queryArg.stationsCursor,
        },
      }),
    }),
    labsEquipmentComputingActivitySummaryRetrieve: build.query<
      LabsEquipmentComputingActivitySummaryRetrieveApiResponse,
      LabsEquipmentComputingActivitySummaryRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/equipment/computing/activity-summary` }),
    }),
    labsEquipmentFacetsRetrieve: build.query<
      LabsEquipmentFacetsRetrieveApiResponse,
      LabsEquipmentFacetsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/facets`,
        params: {
          assigned: queryArg.assigned,
          category: queryArg.category,
          condition: queryArg.condition,
          created_at_after: queryArg.createdAtAfter,
          created_at_before: queryArg.createdAtBefore,
          customer_id: queryArg.customerId,
          department_id: queryArg.departmentId,
          dimension: queryArg.dimension,
          group_id: queryArg.groupId,
          id: queryArg.id,
          kind: queryArg.kind,
          lifecycle_state: queryArg.lifecycleState,
          loan_overdue: queryArg.loanOverdue,
          manufacturer: queryArg.manufacturer,
          material_id: queryArg.materialId,
          on_loan: queryArg.onLoan,
          owner_id: queryArg.ownerId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          product_model_id: queryArg.productModelId,
          protocol_id: queryArg.protocolId,
          q: queryArg.q,
          resolution_id: queryArg.resolutionId,
          size_id: queryArg.sizeId,
          status: queryArg.status,
          technical_user_id: queryArg.technicalUserId,
          type: queryArg["type"],
        },
      }),
    }),
    labsEquipmentFiltersRetrieve: build.query<
      LabsEquipmentFiltersRetrieveApiResponse,
      LabsEquipmentFiltersRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/filters`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsEquipmentOptionsRetrieve: build.query<
      LabsEquipmentOptionsRetrieveApiResponse,
      LabsEquipmentOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/options`,
        params: {
          assignable: queryArg.assignable,
          assigned: queryArg.assigned,
          category_id: queryArg.categoryId,
          include_ids: queryArg.includeIds,
          kind_id: queryArg.kindId,
          lifecycle_state: queryArg.lifecycleState,
          manufacturer_id: queryArg.manufacturerId,
          q: queryArg.q,
          status: queryArg.status,
          type_id: queryArg.typeId,
        },
      }),
    }),
    labsEquipmentReferenceDataRetrieve: build.query<
      LabsEquipmentReferenceDataRetrieveApiResponse,
      LabsEquipmentReferenceDataRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data`,
        params: {
          category: queryArg.category,
        },
      }),
    }),
    labsEquipmentReferenceDataCategoriesRetrieve: build.query<
      LabsEquipmentReferenceDataCategoriesRetrieveApiResponse,
      LabsEquipmentReferenceDataCategoriesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/categories`,
        params: {
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataCategoriesRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataCategoriesRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataCategoriesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/categories/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataDepartmentsRetrieve: build.query<
      LabsEquipmentReferenceDataDepartmentsRetrieveApiResponse,
      LabsEquipmentReferenceDataDepartmentsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/departments`,
        params: {
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataDepartmentsCreate: build.mutation<
      LabsEquipmentReferenceDataDepartmentsCreateApiResponse,
      LabsEquipmentReferenceDataDepartmentsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/departments`,
        method: "POST",
        body: queryArg.departmentCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataDepartmentsRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataDepartmentsRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataDepartmentsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/departments/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataDisplayResolutionsRetrieve: build.query<
      LabsEquipmentReferenceDataDisplayResolutionsRetrieveApiResponse,
      LabsEquipmentReferenceDataDisplayResolutionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/display-resolutions`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataDisplayResolutionsCreate: build.mutation<
      LabsEquipmentReferenceDataDisplayResolutionsCreateApiResponse,
      LabsEquipmentReferenceDataDisplayResolutionsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/display-resolutions`,
        method: "POST",
        body: queryArg.displayResolutionCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataDisplayResolutionsRetrieveByReferenceId:
      build.query<
        LabsEquipmentReferenceDataDisplayResolutionsRetrieveByReferenceIdApiResponse,
        LabsEquipmentReferenceDataDisplayResolutionsRetrieveByReferenceIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/labs/equipment/reference-data/display-resolutions/${queryArg.referenceId}`,
        }),
      }),
    labsEquipmentReferenceDataDisplaySizesRetrieve: build.query<
      LabsEquipmentReferenceDataDisplaySizesRetrieveApiResponse,
      LabsEquipmentReferenceDataDisplaySizesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/display-sizes`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataDisplaySizesCreate: build.mutation<
      LabsEquipmentReferenceDataDisplaySizesCreateApiResponse,
      LabsEquipmentReferenceDataDisplaySizesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/display-sizes`,
        method: "POST",
        body: queryArg.displaySizeCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataDisplaySizesRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataDisplaySizesRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataDisplaySizesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/display-sizes/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataGroupsRetrieve: build.query<
      LabsEquipmentReferenceDataGroupsRetrieveApiResponse,
      LabsEquipmentReferenceDataGroupsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/groups`,
        params: {
          department_id: queryArg.departmentId,
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataGroupsCreate: build.mutation<
      LabsEquipmentReferenceDataGroupsCreateApiResponse,
      LabsEquipmentReferenceDataGroupsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/groups`,
        method: "POST",
        body: queryArg.groupCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataGroupsRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataGroupsRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataGroupsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/groups/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataInterfacesRetrieve: build.query<
      LabsEquipmentReferenceDataInterfacesRetrieveApiResponse,
      LabsEquipmentReferenceDataInterfacesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/interfaces`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataInterfacesCreate: build.mutation<
      LabsEquipmentReferenceDataInterfacesCreateApiResponse,
      LabsEquipmentReferenceDataInterfacesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/interfaces`,
        method: "POST",
        body: queryArg.equipmentInterfaceCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataInterfacesRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataInterfacesRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataInterfacesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/interfaces/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataKindsRetrieve: build.query<
      LabsEquipmentReferenceDataKindsRetrieveApiResponse,
      LabsEquipmentReferenceDataKindsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/kinds`,
        params: {
          category_id: queryArg.categoryId,
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataKindsCreate: build.mutation<
      LabsEquipmentReferenceDataKindsCreateApiResponse,
      LabsEquipmentReferenceDataKindsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/kinds`,
        method: "POST",
        body: queryArg.equipmentKindCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataKindsRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataKindsRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataKindsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/kinds/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataManufacturersRetrieve: build.query<
      LabsEquipmentReferenceDataManufacturersRetrieveApiResponse,
      LabsEquipmentReferenceDataManufacturersRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/manufacturers`,
        params: {
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataManufacturersCreate: build.mutation<
      LabsEquipmentReferenceDataManufacturersCreateApiResponse,
      LabsEquipmentReferenceDataManufacturersCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/manufacturers`,
        method: "POST",
        body: queryArg.equipmentManufacturerCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataManufacturersRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataManufacturersRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataManufacturersRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/manufacturers/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataMaterialsRetrieve: build.query<
      LabsEquipmentReferenceDataMaterialsRetrieveApiResponse,
      LabsEquipmentReferenceDataMaterialsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/materials`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataMaterialsCreate: build.mutation<
      LabsEquipmentReferenceDataMaterialsCreateApiResponse,
      LabsEquipmentReferenceDataMaterialsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/materials`,
        method: "POST",
        body: queryArg.materialCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataMaterialsRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataMaterialsRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataMaterialsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/materials/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataNetworkingProtocolsRetrieve: build.query<
      LabsEquipmentReferenceDataNetworkingProtocolsRetrieveApiResponse,
      LabsEquipmentReferenceDataNetworkingProtocolsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/networking-protocols`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataNetworkingProtocolsCreate: build.mutation<
      LabsEquipmentReferenceDataNetworkingProtocolsCreateApiResponse,
      LabsEquipmentReferenceDataNetworkingProtocolsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/networking-protocols`,
        method: "POST",
        body: queryArg.networkingProtocolCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataNetworkingProtocolsRetrieveByReferenceId:
      build.query<
        LabsEquipmentReferenceDataNetworkingProtocolsRetrieveByReferenceIdApiResponse,
        LabsEquipmentReferenceDataNetworkingProtocolsRetrieveByReferenceIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/labs/equipment/reference-data/networking-protocols/${queryArg.referenceId}`,
        }),
      }),
    labsEquipmentReferenceDataProductModelSpecificationsRetrieve: build.query<
      LabsEquipmentReferenceDataProductModelSpecificationsRetrieveApiResponse,
      LabsEquipmentReferenceDataProductModelSpecificationsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/product-model-specifications`,
        params: {
          definition_id: queryArg.definitionId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          product_model_id: queryArg.productModelId,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataProductModelSpecificationsCreate: build.mutation<
      LabsEquipmentReferenceDataProductModelSpecificationsCreateApiResponse,
      LabsEquipmentReferenceDataProductModelSpecificationsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/product-model-specifications`,
        method: "POST",
        body: queryArg.productModelSpecificationCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataProductModelSpecificationsRetrieveByReferenceId:
      build.query<
        LabsEquipmentReferenceDataProductModelSpecificationsRetrieveByReferenceIdApiResponse,
        LabsEquipmentReferenceDataProductModelSpecificationsRetrieveByReferenceIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/labs/equipment/reference-data/product-model-specifications/${queryArg.referenceId}`,
        }),
      }),
    labsEquipmentReferenceDataProductModelsRetrieve: build.query<
      LabsEquipmentReferenceDataProductModelsRetrieveApiResponse,
      LabsEquipmentReferenceDataProductModelsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/product-models`,
        params: {
          equipment_type_id: queryArg.equipmentTypeId,
          is_active: queryArg.isActive,
          manufacturer_id: queryArg.manufacturerId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataProductModelsCreate: build.mutation<
      LabsEquipmentReferenceDataProductModelsCreateApiResponse,
      LabsEquipmentReferenceDataProductModelsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/product-models`,
        method: "POST",
        body: queryArg.equipmentProductModelCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataProductModelsRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataProductModelsRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataProductModelsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/product-models/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataSampleCharacteristicsRetrieve: build.query<
      LabsEquipmentReferenceDataSampleCharacteristicsRetrieveApiResponse,
      LabsEquipmentReferenceDataSampleCharacteristicsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/sample-characteristics`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataSampleCharacteristicsCreate: build.mutation<
      LabsEquipmentReferenceDataSampleCharacteristicsCreateApiResponse,
      LabsEquipmentReferenceDataSampleCharacteristicsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/sample-characteristics`,
        method: "POST",
        body: queryArg.sampleCharacteristicCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataSampleCharacteristicsRetrieveByReferenceId:
      build.query<
        LabsEquipmentReferenceDataSampleCharacteristicsRetrieveByReferenceIdApiResponse,
        LabsEquipmentReferenceDataSampleCharacteristicsRetrieveByReferenceIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/labs/equipment/reference-data/sample-characteristics/${queryArg.referenceId}`,
        }),
      }),
    labsEquipmentReferenceDataSampleCustomersRetrieve: build.query<
      LabsEquipmentReferenceDataSampleCustomersRetrieveApiResponse,
      LabsEquipmentReferenceDataSampleCustomersRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/sample-customers`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataSampleCustomersCreate: build.mutation<
      LabsEquipmentReferenceDataSampleCustomersCreateApiResponse,
      LabsEquipmentReferenceDataSampleCustomersCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/sample-customers`,
        method: "POST",
        body: queryArg.sampleCustomerCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataSampleCustomersRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataSampleCustomersRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataSampleCustomersRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/sample-customers/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataSpecificationDefinitionsRetrieve: build.query<
      LabsEquipmentReferenceDataSpecificationDefinitionsRetrieveApiResponse,
      LabsEquipmentReferenceDataSpecificationDefinitionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/specification-definitions`,
        params: {
          category_id: queryArg.categoryId,
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataSpecificationDefinitionsCreate: build.mutation<
      LabsEquipmentReferenceDataSpecificationDefinitionsCreateApiResponse,
      LabsEquipmentReferenceDataSpecificationDefinitionsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/specification-definitions`,
        method: "POST",
        body: queryArg.specificationDefinitionCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataSpecificationDefinitionsRetrieveByReferenceId:
      build.query<
        LabsEquipmentReferenceDataSpecificationDefinitionsRetrieveByReferenceIdApiResponse,
        LabsEquipmentReferenceDataSpecificationDefinitionsRetrieveByReferenceIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/labs/equipment/reference-data/specification-definitions/${queryArg.referenceId}`,
        }),
      }),
    labsEquipmentReferenceDataTechnicalUsersRetrieve: build.query<
      LabsEquipmentReferenceDataTechnicalUsersRetrieveApiResponse,
      LabsEquipmentReferenceDataTechnicalUsersRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/technical-users`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataTechnicalUsersCreate: build.mutation<
      LabsEquipmentReferenceDataTechnicalUsersCreateApiResponse,
      LabsEquipmentReferenceDataTechnicalUsersCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/technical-users`,
        method: "POST",
        body: queryArg.technicalUserCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataTechnicalUsersRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataTechnicalUsersRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataTechnicalUsersRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/technical-users/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentReferenceDataTypesRetrieve: build.query<
      LabsEquipmentReferenceDataTypesRetrieveApiResponse,
      LabsEquipmentReferenceDataTypesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/types`,
        params: {
          is_active: queryArg.isActive,
          kind_id: queryArg.kindId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsEquipmentReferenceDataTypesCreate: build.mutation<
      LabsEquipmentReferenceDataTypesCreateApiResponse,
      LabsEquipmentReferenceDataTypesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/types`,
        method: "POST",
        body: queryArg.equipmentTypeCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsEquipmentReferenceDataTypesRetrieveByReferenceId: build.query<
      LabsEquipmentReferenceDataTypesRetrieveByReferenceIdApiResponse,
      LabsEquipmentReferenceDataTypesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/reference-data/types/${queryArg.referenceId}`,
      }),
    }),
    labsEquipmentSkuRetrieveBySku: build.query<
      LabsEquipmentSkuRetrieveBySkuApiResponse,
      LabsEquipmentSkuRetrieveBySkuApiArg
    >({
      query: (queryArg) => ({ url: `/api/labs/equipment/sku/${queryArg.sku}` }),
    }),
    labsEquipmentSkuPartialUpdateBySku: build.mutation<
      LabsEquipmentSkuPartialUpdateBySkuApiResponse,
      LabsEquipmentSkuPartialUpdateBySkuApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/sku/${queryArg.sku}`,
        method: "PATCH",
        body: queryArg.patchedEquipmentUpdate,
      }),
    }),
    labsEquipmentStatusSummaryRetrieve: build.query<
      LabsEquipmentStatusSummaryRetrieveApiResponse,
      LabsEquipmentStatusSummaryRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/status-summary`,
        params: {
          category: queryArg.category,
        },
      }),
    }),
    labsEquipmentUidRetrieveByUid: build.query<
      LabsEquipmentUidRetrieveByUidApiResponse,
      LabsEquipmentUidRetrieveByUidApiArg
    >({
      query: (queryArg) => ({ url: `/api/labs/equipment/uid/${queryArg.uid}` }),
    }),
    labsEquipmentUidPartialUpdateByUid: build.mutation<
      LabsEquipmentUidPartialUpdateByUidApiResponse,
      LabsEquipmentUidPartialUpdateByUidApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/equipment/uid/${queryArg.uid}`,
        method: "PATCH",
        body: queryArg.patchedEquipmentUpdate,
      }),
    }),
    labsExpectedDevicesRetrieve: build.query<
      LabsExpectedDevicesRetrieveApiResponse,
      LabsExpectedDevicesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/expected-devices`,
        params: {
          bench_id: queryArg.benchId,
          computing_id: queryArg.computingId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          presence: queryArg.presence,
        },
      }),
    }),
    labsExpectedDevicesCreate: build.mutation<
      LabsExpectedDevicesCreateApiResponse,
      LabsExpectedDevicesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/expected-devices`,
        method: "POST",
        body: queryArg.createExpectedDeviceRequest,
      }),
    }),
    labsExpectedDevicesPartialUpdateByExpectedDeviceId: build.mutation<
      LabsExpectedDevicesPartialUpdateByExpectedDeviceIdApiResponse,
      LabsExpectedDevicesPartialUpdateByExpectedDeviceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/expected-devices/${queryArg.expectedDeviceId}`,
        method: "PATCH",
        body: queryArg.patchedUpdateExpectedDeviceRequest,
      }),
    }),
    labsExpectedDevicesDestroyByExpectedDeviceId: build.mutation<
      LabsExpectedDevicesDestroyByExpectedDeviceIdApiResponse,
      LabsExpectedDevicesDestroyByExpectedDeviceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/expected-devices/${queryArg.expectedDeviceId}`,
        method: "DELETE",
      }),
    }),
    labsExpectedDevicesLegacySuggestionsRetrieve: build.query<
      LabsExpectedDevicesLegacySuggestionsRetrieveApiResponse,
      LabsExpectedDevicesLegacySuggestionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/expected-devices/legacy-suggestions`,
        params: {
          computing_id: queryArg.computingId,
        },
      }),
    }),
    labsExpensesPaymentsRetrieveByExpenseId: build.query<
      LabsExpensesPaymentsRetrieveByExpenseIdApiResponse,
      LabsExpensesPaymentsRetrieveByExpenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/expenses/${queryArg.expenseId}/payments`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsExpensesPaymentsCreateByExpenseId: build.mutation<
      LabsExpensesPaymentsCreateByExpenseIdApiResponse,
      LabsExpensesPaymentsCreateByExpenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/expenses/${queryArg.expenseId}/payments`,
        method: "POST",
        body: queryArg.expensePaymentWrite,
      }),
    }),
    labsExpensesReportRetrieve: build.query<
      LabsExpensesReportRetrieveApiResponse,
      LabsExpensesReportRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/expenses/report`,
        params: {
          billing_period: queryArg.billingPeriod,
          currency: queryArg.currency,
          expense_type: queryArg.expenseType,
          from_date: queryArg.fromDate,
          room_id: queryArg.roomId,
          status: queryArg.status,
          to_date: queryArg.toDate,
        },
      }),
    }),
    labsGroupsRetrieve: build.query<
      LabsGroupsRetrieveApiResponse,
      LabsGroupsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/groups`,
        params: {
          department_id: queryArg.departmentId,
          include_ids: queryArg.includeIds,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsGroupsRetrieveByGroupId: build.query<
      LabsGroupsRetrieveByGroupIdApiResponse,
      LabsGroupsRetrieveByGroupIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/labs/groups/${queryArg.groupId}` }),
    }),
    labsGroupsOptionsRetrieve: build.query<
      LabsGroupsOptionsRetrieveApiResponse,
      LabsGroupsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/groups/options`,
        params: {
          department_id: queryArg.departmentId,
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsLabDashboardRetrieve: build.query<
      LabsLabDashboardRetrieveApiResponse,
      LabsLabDashboardRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/lab-dashboard` }),
    }),
    labsLabProjectsRetrieve: build.query<
      LabsLabProjectsRetrieveApiResponse,
      LabsLabProjectsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/lab-projects`,
        params: {
          is_active: queryArg.isActive,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsLabProjectsRetrieveByProjectId: build.query<
      LabsLabProjectsRetrieveByProjectIdApiResponse,
      LabsLabProjectsRetrieveByProjectIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/lab-projects/${queryArg.projectId}`,
      }),
    }),
    labsLabProjectsOptionsRetrieve: build.query<
      LabsLabProjectsOptionsRetrieveApiResponse,
      LabsLabProjectsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/lab-projects/options`,
        params: {
          active_on: queryArg.activeOn,
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsLabSessionsRetrieve: build.query<
      LabsLabSessionsRetrieveApiResponse,
      LabsLabSessionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/lab-sessions`,
        params: {
          access_type: queryArg.accessType,
          bench_id: queryArg.benchId,
          computer_id: queryArg.computerId,
          end_date: queryArg.endDate,
          ordering: queryArg.ordering,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          start_date: queryArg.startDate,
          user_id: queryArg.userId,
        },
      }),
    }),
    labsLeaderboardExportRetrieve: build.query<
      LabsLeaderboardExportRetrieveApiResponse,
      LabsLeaderboardExportRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/leaderboard/export`,
        params: {
          end_date: queryArg.endDate,
          start_date: queryArg.startDate,
          type: queryArg["type"],
        },
      }),
    }),
    labsLeaderboardLabRetrieve: build.query<
      LabsLeaderboardLabRetrieveApiResponse,
      LabsLeaderboardLabRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/leaderboard/lab`,
        params: {
          end_date: queryArg.endDate,
          start_date: queryArg.startDate,
        },
      }),
    }),
    labsLeaderboardPersonaRetrieve: build.query<
      LabsLeaderboardPersonaRetrieveApiResponse,
      LabsLeaderboardPersonaRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/leaderboard/persona`,
        params: {
          end_date: queryArg.endDate,
          start_date: queryArg.startDate,
        },
      }),
    }),
    labsLeaderboardUsersProfileRetrieveById: build.query<
      LabsLeaderboardUsersProfileRetrieveByIdApiResponse,
      LabsLeaderboardUsersProfileRetrieveByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/leaderboard/users/${queryArg.id}/profile`,
        params: {
          end_date: queryArg.endDate,
          start_date: queryArg.startDate,
        },
      }),
    }),
    labsLeaderboardUsersWeeklyUsageRetrieveById: build.query<
      LabsLeaderboardUsersWeeklyUsageRetrieveByIdApiResponse,
      LabsLeaderboardUsersWeeklyUsageRetrieveByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/leaderboard/users/${queryArg.id}/weekly-usage`,
      }),
    }),
    labsLicenseCategoriesRetrieve: build.query<
      LabsLicenseCategoriesRetrieveApiResponse,
      LabsLicenseCategoriesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-categories`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsLicenseCategoriesRetrieveByCategoryId: build.query<
      LabsLicenseCategoriesRetrieveByCategoryIdApiResponse,
      LabsLicenseCategoriesRetrieveByCategoryIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-categories/${queryArg.categoryId}`,
      }),
    }),
    labsLicenseCategoriesOptionsRetrieve: build.query<
      LabsLicenseCategoriesOptionsRetrieveApiResponse,
      LabsLicenseCategoriesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-categories/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsLicenseProductsRetrieve: build.query<
      LabsLicenseProductsRetrieveApiResponse,
      LabsLicenseProductsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-products`,
        params: {
          include_ids: queryArg.includeIds,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          vendor_id: queryArg.vendorId,
        },
      }),
    }),
    labsLicenseProductsRetrieveByProductId: build.query<
      LabsLicenseProductsRetrieveByProductIdApiResponse,
      LabsLicenseProductsRetrieveByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-products/${queryArg.productId}`,
      }),
    }),
    labsLicenseProductsOptionsRetrieve: build.query<
      LabsLicenseProductsOptionsRetrieveApiResponse,
      LabsLicenseProductsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-products/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
          vendor_id: queryArg.vendorId,
        },
      }),
    }),
    labsLicenseRestrictionsRetrieve: build.query<
      LabsLicenseRestrictionsRetrieveApiResponse,
      LabsLicenseRestrictionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-restrictions`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsLicenseRestrictionsRetrieveByRestrictionId: build.query<
      LabsLicenseRestrictionsRetrieveByRestrictionIdApiResponse,
      LabsLicenseRestrictionsRetrieveByRestrictionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-restrictions/${queryArg.restrictionId}`,
      }),
    }),
    labsLicenseRestrictionsOptionsRetrieve: build.query<
      LabsLicenseRestrictionsOptionsRetrieveApiResponse,
      LabsLicenseRestrictionsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-restrictions/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsLicenseTypesRetrieve: build.query<
      LabsLicenseTypesRetrieveApiResponse,
      LabsLicenseTypesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-types`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsLicenseTypesRetrieveByTypeId: build.query<
      LabsLicenseTypesRetrieveByTypeIdApiResponse,
      LabsLicenseTypesRetrieveByTypeIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-types/${queryArg.typeId}`,
      }),
    }),
    labsLicenseTypesOptionsRetrieve: build.query<
      LabsLicenseTypesOptionsRetrieveApiResponse,
      LabsLicenseTypesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-types/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsLicenseVendorsRetrieve: build.query<
      LabsLicenseVendorsRetrieveApiResponse,
      LabsLicenseVendorsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-vendors`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsLicenseVendorsRetrieveByVendorId: build.query<
      LabsLicenseVendorsRetrieveByVendorIdApiResponse,
      LabsLicenseVendorsRetrieveByVendorIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-vendors/${queryArg.vendorId}`,
      }),
    }),
    labsLicenseVendorsOptionsRetrieve: build.query<
      LabsLicenseVendorsOptionsRetrieveApiResponse,
      LabsLicenseVendorsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/license-vendors/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsLicensesRetrieve: build.query<
      LabsLicensesRetrieveApiResponse,
      LabsLicensesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses`,
        params: {
          created_at_after: queryArg.createdAtAfter,
          created_at_before: queryArg.createdAtBefore,
          group_id: queryArg.groupId,
          id: queryArg.id,
          ordering: queryArg.ordering,
          owner_id: queryArg.ownerId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          status: queryArg.status,
        },
      }),
    }),
    labsLicensesCreate: build.mutation<
      LabsLicensesCreateApiResponse,
      LabsLicensesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses`,
        method: "POST",
        body: queryArg.licenseCreate,
      }),
    }),
    labsLicensesRetrieveByLicenseId: build.query<
      LabsLicensesRetrieveByLicenseIdApiResponse,
      LabsLicensesRetrieveByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}`,
      }),
    }),
    labsLicensesPartialUpdateByLicenseId: build.mutation<
      LabsLicensesPartialUpdateByLicenseIdApiResponse,
      LabsLicensesPartialUpdateByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}`,
        method: "PATCH",
        body: queryArg.patchedLicenseUpdate,
      }),
    }),
    labsLicensesDestroyByLicenseId: build.mutation<
      LabsLicensesDestroyByLicenseIdApiResponse,
      LabsLicensesDestroyByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}`,
        method: "DELETE",
      }),
    }),
    labsLicensesActionsAssignCreateByLicenseId: build.mutation<
      LabsLicensesActionsAssignCreateByLicenseIdApiResponse,
      LabsLicensesActionsAssignCreateByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}/actions/assign`,
        method: "POST",
        body: queryArg.licenseAssignmentRequest,
      }),
    }),
    labsLicensesActionsAssignDestroyByLicenseId: build.mutation<
      LabsLicensesActionsAssignDestroyByLicenseIdApiResponse,
      LabsLicensesActionsAssignDestroyByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}/actions/assign`,
        method: "DELETE",
      }),
    }),
    labsLicensesActionsChangeStatusCreateByLicenseId: build.mutation<
      LabsLicensesActionsChangeStatusCreateByLicenseIdApiResponse,
      LabsLicensesActionsChangeStatusCreateByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}/actions/change-status`,
        method: "POST",
        body: queryArg.licenseStatus,
      }),
    }),
    labsLicensesAgreementsRetrieveByLicenseId: build.query<
      LabsLicensesAgreementsRetrieveByLicenseIdApiResponse,
      LabsLicensesAgreementsRetrieveByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}/agreements`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsLicensesAgreementsCreateByLicenseId: build.mutation<
      LabsLicensesAgreementsCreateByLicenseIdApiResponse,
      LabsLicensesAgreementsCreateByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}/agreements`,
        method: "POST",
        body: queryArg.licenseAgreementWrite,
      }),
    }),
    labsLicensesHistoryRetrieveByLicenseId: build.query<
      LabsLicensesHistoryRetrieveByLicenseIdApiResponse,
      LabsLicensesHistoryRetrieveByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}/history`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsLicensesImageRetrieveByLicenseId: build.query<
      LabsLicensesImageRetrieveByLicenseIdApiResponse,
      LabsLicensesImageRetrieveByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}/image`,
      }),
    }),
    labsLicensesImageUpdateByLicenseId: build.mutation<
      LabsLicensesImageUpdateByLicenseIdApiResponse,
      LabsLicensesImageUpdateByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}/image`,
        method: "PUT",
        body: queryArg.resourceImageUpload,
      }),
    }),
    labsLicensesImageDestroyByLicenseId: build.mutation<
      LabsLicensesImageDestroyByLicenseIdApiResponse,
      LabsLicensesImageDestroyByLicenseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/${queryArg.licenseId}/image`,
        method: "DELETE",
      }),
    }),
    labsLicensesCategoriesSummaryRetrieve: build.query<
      LabsLicensesCategoriesSummaryRetrieveApiResponse,
      LabsLicensesCategoriesSummaryRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/categories/summary`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsLicensesFiltersRetrieve: build.query<
      LabsLicensesFiltersRetrieveApiResponse,
      LabsLicensesFiltersRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/filters`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsLicensesReferenceDataCategoriesRetrieve: build.query<
      LabsLicensesReferenceDataCategoriesRetrieveApiResponse,
      LabsLicensesReferenceDataCategoriesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/categories`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsLicensesReferenceDataCategoriesCreate: build.mutation<
      LabsLicensesReferenceDataCategoriesCreateApiResponse,
      LabsLicensesReferenceDataCategoriesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/categories`,
        method: "POST",
        body: queryArg.licenseCategoryCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsLicensesReferenceDataCategoriesRetrieveByReferenceId: build.query<
      LabsLicensesReferenceDataCategoriesRetrieveByReferenceIdApiResponse,
      LabsLicensesReferenceDataCategoriesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/categories/${queryArg.referenceId}`,
      }),
    }),
    labsLicensesReferenceDataProductsRetrieve: build.query<
      LabsLicensesReferenceDataProductsRetrieveApiResponse,
      LabsLicensesReferenceDataProductsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/products`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          vendor_id: queryArg.vendorId,
        },
      }),
    }),
    labsLicensesReferenceDataProductsCreate: build.mutation<
      LabsLicensesReferenceDataProductsCreateApiResponse,
      LabsLicensesReferenceDataProductsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/products`,
        method: "POST",
        body: queryArg.licenseProductCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsLicensesReferenceDataProductsRetrieveByReferenceId: build.query<
      LabsLicensesReferenceDataProductsRetrieveByReferenceIdApiResponse,
      LabsLicensesReferenceDataProductsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/products/${queryArg.referenceId}`,
      }),
    }),
    labsLicensesReferenceDataRestrictionsRetrieve: build.query<
      LabsLicensesReferenceDataRestrictionsRetrieveApiResponse,
      LabsLicensesReferenceDataRestrictionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/restrictions`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsLicensesReferenceDataRestrictionsCreate: build.mutation<
      LabsLicensesReferenceDataRestrictionsCreateApiResponse,
      LabsLicensesReferenceDataRestrictionsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/restrictions`,
        method: "POST",
        body: queryArg.licenseRestrictionCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsLicensesReferenceDataRestrictionsRetrieveByReferenceId: build.query<
      LabsLicensesReferenceDataRestrictionsRetrieveByReferenceIdApiResponse,
      LabsLicensesReferenceDataRestrictionsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/restrictions/${queryArg.referenceId}`,
      }),
    }),
    labsLicensesReferenceDataTypesRetrieve: build.query<
      LabsLicensesReferenceDataTypesRetrieveApiResponse,
      LabsLicensesReferenceDataTypesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/types`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsLicensesReferenceDataTypesCreate: build.mutation<
      LabsLicensesReferenceDataTypesCreateApiResponse,
      LabsLicensesReferenceDataTypesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/types`,
        method: "POST",
        body: queryArg.licenseTypeCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsLicensesReferenceDataTypesRetrieveByReferenceId: build.query<
      LabsLicensesReferenceDataTypesRetrieveByReferenceIdApiResponse,
      LabsLicensesReferenceDataTypesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/types/${queryArg.referenceId}`,
      }),
    }),
    labsLicensesReferenceDataVendorsRetrieve: build.query<
      LabsLicensesReferenceDataVendorsRetrieveApiResponse,
      LabsLicensesReferenceDataVendorsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/vendors`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsLicensesReferenceDataVendorsCreate: build.mutation<
      LabsLicensesReferenceDataVendorsCreateApiResponse,
      LabsLicensesReferenceDataVendorsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/vendors`,
        method: "POST",
        body: queryArg.licenseVendorCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsLicensesReferenceDataVendorsRetrieveByReferenceId: build.query<
      LabsLicensesReferenceDataVendorsRetrieveByReferenceIdApiResponse,
      LabsLicensesReferenceDataVendorsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/licenses/reference-data/vendors/${queryArg.referenceId}`,
      }),
    }),
    labsLicensesStatusSummaryRetrieve: build.query<
      LabsLicensesStatusSummaryRetrieveApiResponse,
      LabsLicensesStatusSummaryRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/licenses/status-summary` }),
    }),
    labsLocationsReferenceDataBuildingsRetrieve: build.query<
      LabsLocationsReferenceDataBuildingsRetrieveApiResponse,
      LabsLocationsReferenceDataBuildingsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/buildings`,
        params: {
          city_id: queryArg.cityId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsLocationsReferenceDataBuildingsCreate: build.mutation<
      LabsLocationsReferenceDataBuildingsCreateApiResponse,
      LabsLocationsReferenceDataBuildingsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/buildings`,
        method: "POST",
        body: queryArg.buildingCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsLocationsReferenceDataBuildingsRetrieveByReferenceId: build.query<
      LabsLocationsReferenceDataBuildingsRetrieveByReferenceIdApiResponse,
      LabsLocationsReferenceDataBuildingsRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/buildings/${queryArg.referenceId}`,
      }),
    }),
    labsLocationsReferenceDataCitiesRetrieve: build.query<
      LabsLocationsReferenceDataCitiesRetrieveApiResponse,
      LabsLocationsReferenceDataCitiesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/cities`,
        params: {
          country_id: queryArg.countryId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsLocationsReferenceDataCitiesCreate: build.mutation<
      LabsLocationsReferenceDataCitiesCreateApiResponse,
      LabsLocationsReferenceDataCitiesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/cities`,
        method: "POST",
        body: queryArg.cityCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsLocationsReferenceDataCitiesRetrieveByReferenceId: build.query<
      LabsLocationsReferenceDataCitiesRetrieveByReferenceIdApiResponse,
      LabsLocationsReferenceDataCitiesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/cities/${queryArg.referenceId}`,
      }),
    }),
    labsLocationsReferenceDataCountriesRetrieve: build.query<
      LabsLocationsReferenceDataCountriesRetrieveApiResponse,
      LabsLocationsReferenceDataCountriesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/countries`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsLocationsReferenceDataCountriesCreate: build.mutation<
      LabsLocationsReferenceDataCountriesCreateApiResponse,
      LabsLocationsReferenceDataCountriesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/countries`,
        method: "POST",
        body: queryArg.countryCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsLocationsReferenceDataCountriesRetrieveByReferenceId: build.query<
      LabsLocationsReferenceDataCountriesRetrieveByReferenceIdApiResponse,
      LabsLocationsReferenceDataCountriesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/countries/${queryArg.referenceId}`,
      }),
    }),
    labsLocationsReferenceDataStationTypesRetrieve: build.query<
      LabsLocationsReferenceDataStationTypesRetrieveApiResponse,
      LabsLocationsReferenceDataStationTypesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/station-types`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
        },
      }),
    }),
    labsLocationsReferenceDataStationTypesCreate: build.mutation<
      LabsLocationsReferenceDataStationTypesCreateApiResponse,
      LabsLocationsReferenceDataStationTypesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/station-types`,
        method: "POST",
        body: queryArg.stationTypeCatalogCreate,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsLocationsReferenceDataStationTypesRetrieveByReferenceId: build.query<
      LabsLocationsReferenceDataStationTypesRetrieveByReferenceIdApiResponse,
      LabsLocationsReferenceDataStationTypesRetrieveByReferenceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/locations/reference-data/station-types/${queryArg.referenceId}`,
      }),
    }),
    labsMonitoringEventsRetrieve: build.query<
      LabsMonitoringEventsRetrieveApiResponse,
      LabsMonitoringEventsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/monitoring-events`,
        params: {
          action: queryArg.action,
          bench_id: queryArg.benchId,
          computer_id: queryArg.computerId,
          computer_sku: queryArg.computerSku,
          computing_id: queryArg.computingId,
          from_date: queryArg.fromDate,
          from_date_time: queryArg.fromDateTime,
          lab: queryArg.lab,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          subject_type: queryArg.subjectType,
          to_date: queryArg.toDate,
          to_date_time: queryArg.toDateTime,
        },
      }),
    }),
    labsMonitoringEventsCreate: build.mutation<
      LabsMonitoringEventsCreateApiResponse,
      LabsMonitoringEventsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/monitoring-events`,
        method: "POST",
        body: queryArg.monitoringEventCreate,
      }),
    }),
    labsMonitoringEventsRetrieveById: build.query<
      LabsMonitoringEventsRetrieveByIdApiResponse,
      LabsMonitoringEventsRetrieveByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/monitoring-events/${queryArg.id}`,
      }),
    }),
    labsMonitoringEventsExportRetrieve: build.query<
      LabsMonitoringEventsExportRetrieveApiResponse,
      LabsMonitoringEventsExportRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/monitoring-events/export`,
        params: {
          action: queryArg.action,
          bench_id: queryArg.benchId,
          computer_id: queryArg.computerId,
          computer_sku: queryArg.computerSku,
          computing_id: queryArg.computingId,
          from_date: queryArg.fromDate,
          from_date_time: queryArg.fromDateTime,
          lab: queryArg.lab,
          subject_type: queryArg.subjectType,
          to_date: queryArg.toDate,
          to_date_time: queryArg.toDateTime,
        },
      }),
    }),
    labsPurchaseItemsResourcesRetrieveByPurchaseItemId: build.query<
      LabsPurchaseItemsResourcesRetrieveByPurchaseItemIdApiResponse,
      LabsPurchaseItemsResourcesRetrieveByPurchaseItemIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchase-items/${queryArg.purchaseItemId}/resources`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsPurchaseItemsResourcesCreateByPurchaseItemId: build.mutation<
      LabsPurchaseItemsResourcesCreateByPurchaseItemIdApiResponse,
      LabsPurchaseItemsResourcesCreateByPurchaseItemIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchase-items/${queryArg.purchaseItemId}/resources`,
        method: "POST",
        body: queryArg.purchaseItemResourceCreate,
      }),
    }),
    labsPurchasePrioritiesRetrieve: build.query<
      LabsPurchasePrioritiesRetrieveApiResponse,
      LabsPurchasePrioritiesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchase-priorities`,
        params: {
          include_inactive: queryArg.includeInactive,
        },
      }),
    }),
    labsPurchasesRetrieve: build.query<
      LabsPurchasesRetrieveApiResponse,
      LabsPurchasesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsPurchasesCreate: build.mutation<
      LabsPurchasesCreateApiResponse,
      LabsPurchasesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases`,
        method: "POST",
        body: queryArg.purchase,
      }),
    }),
    labsPurchasesRetrieveByPurchaseId: build.query<
      LabsPurchasesRetrieveByPurchaseIdApiResponse,
      LabsPurchasesRetrieveByPurchaseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}`,
      }),
    }),
    labsPurchasesDraftPartialUpdateByPurchaseId: build.mutation<
      LabsPurchasesDraftPartialUpdateByPurchaseIdApiResponse,
      LabsPurchasesDraftPartialUpdateByPurchaseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/draft`,
        method: "PATCH",
        body: queryArg.patchedPurchaseDraftHeaderInput,
      }),
    }),
    labsPurchasesItemsRetrieveByPurchaseId: build.query<
      LabsPurchasesItemsRetrieveByPurchaseIdApiResponse,
      LabsPurchasesItemsRetrieveByPurchaseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/items`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsPurchasesItemsCreateByPurchaseId: build.mutation<
      LabsPurchasesItemsCreateByPurchaseIdApiResponse,
      LabsPurchasesItemsCreateByPurchaseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/items`,
        method: "POST",
        body: queryArg.purchaseItem,
      }),
    }),
    labsPurchasesItemsRetrieveByPurchaseIdItemId: build.query<
      LabsPurchasesItemsRetrieveByPurchaseIdItemIdApiResponse,
      LabsPurchasesItemsRetrieveByPurchaseIdItemIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/items/${queryArg.itemId}`,
      }),
    }),
    labsPurchasesItemsPartialUpdateByPurchaseIdItemId: build.mutation<
      LabsPurchasesItemsPartialUpdateByPurchaseIdItemIdApiResponse,
      LabsPurchasesItemsPartialUpdateByPurchaseIdItemIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/items/${queryArg.itemId}`,
        method: "PATCH",
        body: queryArg.patchedDraftLinePatchInput,
      }),
    }),
    labsPurchasesItemsDestroyByPurchaseIdItemId: build.mutation<
      LabsPurchasesItemsDestroyByPurchaseIdItemIdApiResponse,
      LabsPurchasesItemsDestroyByPurchaseIdItemIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/items/${queryArg.itemId}`,
        method: "DELETE",
      }),
    }),
    labsPurchasesItemsDraftRetrieveByPurchaseId: build.query<
      LabsPurchasesItemsDraftRetrieveByPurchaseIdApiResponse,
      LabsPurchasesItemsDraftRetrieveByPurchaseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/items/draft`,
      }),
    }),
    labsPurchasesItemsDraftCreateByPurchaseId: build.mutation<
      LabsPurchasesItemsDraftCreateByPurchaseIdApiResponse,
      LabsPurchasesItemsDraftCreateByPurchaseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/items/draft`,
        method: "POST",
        body: queryArg.draftLineInput,
      }),
    }),
    labsPurchasesTransactionsRetrieveByPurchaseId: build.query<
      LabsPurchasesTransactionsRetrieveByPurchaseIdApiResponse,
      LabsPurchasesTransactionsRetrieveByPurchaseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/transactions`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsPurchasesTransactionsCreateByPurchaseId: build.mutation<
      LabsPurchasesTransactionsCreateByPurchaseIdApiResponse,
      LabsPurchasesTransactionsCreateByPurchaseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/purchases/${queryArg.purchaseId}/transactions`,
        method: "POST",
        body: queryArg.purchaseTransactionWrite,
      }),
    }),
    labsResourceMappingsRetrieve: build.query<
      LabsResourceMappingsRetrieveApiResponse,
      LabsResourceMappingsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/resource-mappings`,
        params: {
          bench_id: queryArg.benchId,
          equipment_category_id: queryArg.equipmentCategoryId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          room_id: queryArg.roomId,
          state: queryArg.state,
          station_id: queryArg.stationId,
        },
      }),
    }),
    labsResourcesAuditsRetrieveByResourceTypeResourceId: build.query<
      LabsResourcesAuditsRetrieveByResourceTypeResourceIdApiResponse,
      LabsResourcesAuditsRetrieveByResourceTypeResourceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/resources/${queryArg.resourceType}/${queryArg.resourceId}/audits`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsResourcesAuditsCreateByResourceTypeResourceId: build.mutation<
      LabsResourcesAuditsCreateByResourceTypeResourceIdApiResponse,
      LabsResourcesAuditsCreateByResourceTypeResourceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/resources/${queryArg.resourceType}/${queryArg.resourceId}/audits`,
        method: "POST",
        body: queryArg.recordResourceAuditRequest,
      }),
    }),
    labsResourcesIdAuditsRetrieveByResourceId: build.query<
      LabsResourcesIdAuditsRetrieveByResourceIdApiResponse,
      LabsResourcesIdAuditsRetrieveByResourceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/resources/id/${queryArg.resourceId}/audits`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsResourcesIdAuditsCreateByResourceId: build.mutation<
      LabsResourcesIdAuditsCreateByResourceIdApiResponse,
      LabsResourcesIdAuditsCreateByResourceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/resources/id/${queryArg.resourceId}/audits`,
        method: "POST",
        body: queryArg.recordResourceAuditRequest,
      }),
    }),
    labsResourcesSkuAuditsRetrieveBySku: build.query<
      LabsResourcesSkuAuditsRetrieveBySkuApiResponse,
      LabsResourcesSkuAuditsRetrieveBySkuApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/resources/sku/${queryArg.sku}/audits`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsResourcesSkuAuditsCreateBySku: build.mutation<
      LabsResourcesSkuAuditsCreateBySkuApiResponse,
      LabsResourcesSkuAuditsCreateBySkuApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/resources/sku/${queryArg.sku}/audits`,
        method: "POST",
        body: queryArg.recordResourceAuditRequest,
      }),
    }),
    labsResourcesUidAuditsRetrieveByUid: build.query<
      LabsResourcesUidAuditsRetrieveByUidApiResponse,
      LabsResourcesUidAuditsRetrieveByUidApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/resources/uid/${queryArg.uid}/audits`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsResourcesUidAuditsCreateByUid: build.mutation<
      LabsResourcesUidAuditsCreateByUidApiResponse,
      LabsResourcesUidAuditsCreateByUidApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/resources/uid/${queryArg.uid}/audits`,
        method: "POST",
        body: queryArg.recordResourceAuditRequest,
        headers: {
          "Idempotency-Key": queryArg["Idempotency-Key"],
        },
      }),
    }),
    labsRoomsRetrieve: build.query<
      LabsRoomsRetrieveApiResponse,
      LabsRoomsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms`,
        params: {
          access_policy: queryArg.accessPolicy,
          activity_status: queryArg.activityStatus,
          building_id: queryArg.buildingId,
          city_id: queryArg.cityId,
          condition: queryArg.condition,
          country_id: queryArg.countryId,
          created_at_after: queryArg.createdAtAfter,
          created_at_before: queryArg.createdAtBefore,
          group_id: queryArg.groupId,
          id: queryArg.id,
          lifecycle_status: queryArg.lifecycleStatus,
          ordering: queryArg.ordering,
          owner_id: queryArg.ownerId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          status: queryArg.status,
        },
      }),
    }),
    labsRoomsCreate: build.mutation<
      LabsRoomsCreateApiResponse,
      LabsRoomsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms`,
        method: "POST",
        body: queryArg.roomCreate,
      }),
    }),
    labsRoomsMappingRetrieveByResourceId: build.query<
      LabsRoomsMappingRetrieveByResourceIdApiResponse,
      LabsRoomsMappingRetrieveByResourceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.resourceId}/mapping`,
        params: {
          benches_cursor: queryArg.benchesCursor,
          equipment_cursor: queryArg.equipmentCursor,
          license_assignments_cursor: queryArg.licenseAssignmentsCursor,
          licenses_cursor: queryArg.licensesCursor,
          page_size: queryArg.pageSize,
          room_slots_cursor: queryArg.roomSlotsCursor,
          rooms_cursor: queryArg.roomsCursor,
          station_slots_cursor: queryArg.stationSlotsCursor,
          stations_cursor: queryArg.stationsCursor,
        },
      }),
    }),
    labsRoomsRetrieveByRoomId: build.query<
      LabsRoomsRetrieveByRoomIdApiResponse,
      LabsRoomsRetrieveByRoomIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/labs/rooms/${queryArg.roomId}` }),
    }),
    labsRoomsUpdateByRoomId: build.mutation<
      LabsRoomsUpdateByRoomIdApiResponse,
      LabsRoomsUpdateByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}`,
        method: "PUT",
        body: queryArg.roomUpdate,
      }),
    }),
    labsRoomsPartialUpdateByRoomId: build.mutation<
      LabsRoomsPartialUpdateByRoomIdApiResponse,
      LabsRoomsPartialUpdateByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}`,
        method: "PATCH",
        body: queryArg.patchedRoomUpdate,
      }),
    }),
    labsRoomsDestroyByRoomId: build.mutation<
      LabsRoomsDestroyByRoomIdApiResponse,
      LabsRoomsDestroyByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}`,
        method: "DELETE",
      }),
    }),
    labsRoomsActionsChangeLifecycleCreateByRoomId: build.mutation<
      LabsRoomsActionsChangeLifecycleCreateByRoomIdApiResponse,
      LabsRoomsActionsChangeLifecycleCreateByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/actions/change-lifecycle`,
        method: "POST",
        body: queryArg.roomLifecycleWrite,
      }),
    }),
    labsRoomsActionsChangeStatusCreateByRoomId: build.mutation<
      LabsRoomsActionsChangeStatusCreateByRoomIdApiResponse,
      LabsRoomsActionsChangeStatusCreateByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/actions/change-status`,
        method: "POST",
        body: queryArg.roomStatusWrite,
      }),
    }),
    labsRoomsActionsGenerateSlotsCreateByRoomId: build.mutation<
      LabsRoomsActionsGenerateSlotsCreateByRoomIdApiResponse,
      LabsRoomsActionsGenerateSlotsCreateByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/actions/generate-slots`,
        method: "POST",
      }),
    }),
    labsRoomsExpensesRetrieveByRoomId: build.query<
      LabsRoomsExpensesRetrieveByRoomIdApiResponse,
      LabsRoomsExpensesRetrieveByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/expenses`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsRoomsExpensesCreateByRoomId: build.mutation<
      LabsRoomsExpensesCreateByRoomIdApiResponse,
      LabsRoomsExpensesCreateByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/expenses`,
        method: "POST",
        body: queryArg.expenseWrite,
      }),
    }),
    labsRoomsExpensesReportRetrieveByRoomId: build.query<
      LabsRoomsExpensesReportRetrieveByRoomIdApiResponse,
      LabsRoomsExpensesReportRetrieveByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.pathRoomId}/expenses/report`,
        params: {
          billing_period: queryArg.billingPeriod,
          currency: queryArg.currency,
          expense_type: queryArg.expenseType,
          from_date: queryArg.fromDate,
          room_id: queryArg.queryRoomId,
          status: queryArg.status,
          to_date: queryArg.toDate,
        },
      }),
    }),
    labsRoomsHistoryRetrieveByRoomId: build.query<
      LabsRoomsHistoryRetrieveByRoomIdApiResponse,
      LabsRoomsHistoryRetrieveByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/history`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsRoomsImageRetrieveByRoomId: build.query<
      LabsRoomsImageRetrieveByRoomIdApiResponse,
      LabsRoomsImageRetrieveByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/image`,
      }),
    }),
    labsRoomsImageUpdateByRoomId: build.mutation<
      LabsRoomsImageUpdateByRoomIdApiResponse,
      LabsRoomsImageUpdateByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/image`,
        method: "PUT",
        body: queryArg.resourceImageUpload,
      }),
    }),
    labsRoomsImageDestroyByRoomId: build.mutation<
      LabsRoomsImageDestroyByRoomIdApiResponse,
      LabsRoomsImageDestroyByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/image`,
        method: "DELETE",
      }),
    }),
    labsRoomsObservationsRetrieveByRoomId: build.query<
      LabsRoomsObservationsRetrieveByRoomIdApiResponse,
      LabsRoomsObservationsRetrieveByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/observations`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsRoomsObservationsCreateByRoomId: build.mutation<
      LabsRoomsObservationsCreateByRoomIdApiResponse,
      LabsRoomsObservationsCreateByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/observations`,
        method: "POST",
        body: queryArg.roomObservationWrite,
      }),
    }),
    labsRoomsSlotsRetrieveByRoomId: build.query<
      LabsRoomsSlotsRetrieveByRoomIdApiResponse,
      LabsRoomsSlotsRetrieveByRoomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/${queryArg.roomId}/slots`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsRoomsFiltersRetrieve: build.query<
      LabsRoomsFiltersRetrieveApiResponse,
      LabsRoomsFiltersRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/filters`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsRoomsOptionsRetrieve: build.query<
      LabsRoomsOptionsRetrieveApiResponse,
      LabsRoomsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/rooms/options`,
        params: {
          building_id: queryArg.buildingId,
          city_id: queryArg.cityId,
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsRoomsStatusSummaryRetrieve: build.query<
      LabsRoomsStatusSummaryRetrieveApiResponse,
      LabsRoomsStatusSummaryRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/rooms/status-summary` }),
    }),
    labsStationTypesRetrieve: build.query<
      LabsStationTypesRetrieveApiResponse,
      LabsStationTypesRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/station-types`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsStationTypesCreate: build.mutation<
      LabsStationTypesCreateApiResponse,
      LabsStationTypesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/station-types`,
        method: "POST",
        body: queryArg.stationTypeWrite,
      }),
    }),
    labsStationTypesRetrieveByTypeId: build.query<
      LabsStationTypesRetrieveByTypeIdApiResponse,
      LabsStationTypesRetrieveByTypeIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/station-types/${queryArg.typeId}`,
      }),
    }),
    labsStationTypesPartialUpdateByTypeId: build.mutation<
      LabsStationTypesPartialUpdateByTypeIdApiResponse,
      LabsStationTypesPartialUpdateByTypeIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/station-types/${queryArg.typeId}`,
        method: "PATCH",
        body: queryArg.patchedStationTypeWrite,
      }),
    }),
    labsStationTypesDestroyByTypeId: build.mutation<
      LabsStationTypesDestroyByTypeIdApiResponse,
      LabsStationTypesDestroyByTypeIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/station-types/${queryArg.typeId}`,
        method: "DELETE",
      }),
    }),
    labsStationTypesOptionsRetrieve: build.query<
      LabsStationTypesOptionsRetrieveApiResponse,
      LabsStationTypesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/station-types/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    labsStationsRetrieve: build.query<
      LabsStationsRetrieveApiResponse,
      LabsStationsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations`,
        params: {
          access_policy: queryArg.accessPolicy,
          activity_status: queryArg.activityStatus,
          condition: queryArg.condition,
          created_at_after: queryArg.createdAtAfter,
          created_at_before: queryArg.createdAtBefore,
          group_id: queryArg.groupId,
          id: queryArg.id,
          lifecycle_status: queryArg.lifecycleStatus,
          ordering: queryArg.ordering,
          owner_id: queryArg.ownerId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          q: queryArg.q,
          room_id: queryArg.roomId,
          status: queryArg.status,
          type_id: queryArg.typeId,
        },
      }),
    }),
    labsStationsCreate: build.mutation<
      LabsStationsCreateApiResponse,
      LabsStationsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations`,
        method: "POST",
        body: queryArg.stationCreate,
      }),
    }),
    labsStationsMappingRetrieveByResourceId: build.query<
      LabsStationsMappingRetrieveByResourceIdApiResponse,
      LabsStationsMappingRetrieveByResourceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.resourceId}/mapping`,
        params: {
          benches_cursor: queryArg.benchesCursor,
          equipment_cursor: queryArg.equipmentCursor,
          license_assignments_cursor: queryArg.licenseAssignmentsCursor,
          licenses_cursor: queryArg.licensesCursor,
          page_size: queryArg.pageSize,
          room_slots_cursor: queryArg.roomSlotsCursor,
          rooms_cursor: queryArg.roomsCursor,
          station_slots_cursor: queryArg.stationSlotsCursor,
          stations_cursor: queryArg.stationsCursor,
        },
      }),
    }),
    labsStationsRetrieveByStationId: build.query<
      LabsStationsRetrieveByStationIdApiResponse,
      LabsStationsRetrieveByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}`,
      }),
    }),
    labsStationsUpdateByStationId: build.mutation<
      LabsStationsUpdateByStationIdApiResponse,
      LabsStationsUpdateByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}`,
        method: "PUT",
        body: queryArg.stationUpdate,
      }),
    }),
    labsStationsPartialUpdateByStationId: build.mutation<
      LabsStationsPartialUpdateByStationIdApiResponse,
      LabsStationsPartialUpdateByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}`,
        method: "PATCH",
        body: queryArg.patchedStationUpdate,
      }),
    }),
    labsStationsDestroyByStationId: build.mutation<
      LabsStationsDestroyByStationIdApiResponse,
      LabsStationsDestroyByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}`,
        method: "DELETE",
      }),
    }),
    labsStationsActionsChangeLifecycleCreateByStationId: build.mutation<
      LabsStationsActionsChangeLifecycleCreateByStationIdApiResponse,
      LabsStationsActionsChangeLifecycleCreateByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/actions/change-lifecycle`,
        method: "POST",
        body: queryArg.stationLifecycleWrite,
      }),
    }),
    labsStationsActionsChangeStatusCreateByStationId: build.mutation<
      LabsStationsActionsChangeStatusCreateByStationIdApiResponse,
      LabsStationsActionsChangeStatusCreateByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/actions/change-status`,
        method: "POST",
        body: queryArg.stationStatusWrite,
      }),
    }),
    labsStationsActionsPlaceCreateByStationId: build.mutation<
      LabsStationsActionsPlaceCreateByStationIdApiResponse,
      LabsStationsActionsPlaceCreateByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/actions/place`,
        method: "POST",
        body: queryArg.stationPlacement,
      }),
    }),
    labsStationsActionsPlacePartialUpdateByStationId: build.mutation<
      LabsStationsActionsPlacePartialUpdateByStationIdApiResponse,
      LabsStationsActionsPlacePartialUpdateByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/actions/place`,
        method: "PATCH",
        body: queryArg.patchedStationPlacement,
      }),
    }),
    labsStationsHistoryRetrieveByStationId: build.query<
      LabsStationsHistoryRetrieveByStationIdApiResponse,
      LabsStationsHistoryRetrieveByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/history`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsStationsImageRetrieveByStationId: build.query<
      LabsStationsImageRetrieveByStationIdApiResponse,
      LabsStationsImageRetrieveByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/image`,
      }),
    }),
    labsStationsImageUpdateByStationId: build.mutation<
      LabsStationsImageUpdateByStationIdApiResponse,
      LabsStationsImageUpdateByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/image`,
        method: "PUT",
        body: queryArg.resourceImageUpload,
      }),
    }),
    labsStationsImageDestroyByStationId: build.mutation<
      LabsStationsImageDestroyByStationIdApiResponse,
      LabsStationsImageDestroyByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/image`,
        method: "DELETE",
      }),
    }),
    labsStationsSlotsRetrieveByStationId: build.query<
      LabsStationsSlotsRetrieveByStationIdApiResponse,
      LabsStationsSlotsRetrieveByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/slots`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsStationsSlotsCreateByStationId: build.mutation<
      LabsStationsSlotsCreateByStationIdApiResponse,
      LabsStationsSlotsCreateByStationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/slots`,
        method: "POST",
        body: queryArg.stationSlotCreate,
      }),
    }),
    labsStationsSlotsRetrieveByStationIdSlotId: build.query<
      LabsStationsSlotsRetrieveByStationIdSlotIdApiResponse,
      LabsStationsSlotsRetrieveByStationIdSlotIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/slots/${queryArg.slotId}`,
      }),
    }),
    labsStationsSlotsUpdateByStationIdSlotId: build.mutation<
      LabsStationsSlotsUpdateByStationIdSlotIdApiResponse,
      LabsStationsSlotsUpdateByStationIdSlotIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/slots/${queryArg.slotId}`,
        method: "PUT",
        body: queryArg.stationSlotUpdate,
      }),
    }),
    labsStationsSlotsPartialUpdateByStationIdSlotId: build.mutation<
      LabsStationsSlotsPartialUpdateByStationIdSlotIdApiResponse,
      LabsStationsSlotsPartialUpdateByStationIdSlotIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/slots/${queryArg.slotId}`,
        method: "PATCH",
        body: queryArg.patchedStationSlotUpdate,
      }),
    }),
    labsStationsSlotsDestroyByStationIdSlotId: build.mutation<
      LabsStationsSlotsDestroyByStationIdSlotIdApiResponse,
      LabsStationsSlotsDestroyByStationIdSlotIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/${queryArg.stationId}/slots/${queryArg.slotId}`,
        method: "DELETE",
      }),
    }),
    labsStationsFiltersRetrieve: build.query<
      LabsStationsFiltersRetrieveApiResponse,
      LabsStationsFiltersRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/filters`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    labsStationsOptionsRetrieve: build.query<
      LabsStationsOptionsRetrieveApiResponse,
      LabsStationsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/stations/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
          room_id: queryArg.roomId,
          station_type_id: queryArg.stationTypeId,
        },
      }),
    }),
    labsStationsReferenceDataRetrieve: build.query<
      LabsStationsReferenceDataRetrieveApiResponse,
      LabsStationsReferenceDataRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/stations/reference-data` }),
    }),
    labsStationsStatusSummaryRetrieve: build.query<
      LabsStationsStatusSummaryRetrieveApiResponse,
      LabsStationsStatusSummaryRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/stations/status-summary` }),
    }),
    labsWorkbookImportsActionsApplyCreate: build.mutation<
      LabsWorkbookImportsActionsApplyCreateApiResponse,
      LabsWorkbookImportsActionsApplyCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/workbook-imports/actions/apply`,
        method: "POST",
        body: queryArg.workbookUpload,
      }),
    }),
    labsWorkbookImportsActionsCheckCreate: build.mutation<
      LabsWorkbookImportsActionsCheckCreateApiResponse,
      LabsWorkbookImportsActionsCheckCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/labs/workbook-imports/actions/check`,
        method: "POST",
        body: queryArg.workbookUpload,
      }),
    }),
    labsWorkbookImportsExportRetrieve: build.query<
      LabsWorkbookImportsExportRetrieveApiResponse,
      LabsWorkbookImportsExportRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/workbook-imports/export` }),
    }),
    labsWorkbookImportsTemplateRetrieve: build.query<
      LabsWorkbookImportsTemplateRetrieveApiResponse,
      LabsWorkbookImportsTemplateRetrieveApiArg
    >({
      query: () => ({ url: `/api/labs/workbook-imports/template` }),
    }),
    loginCreate: build.mutation<LoginCreateApiResponse, LoginCreateApiArg>({
      query: (queryArg) => ({
        url: `/api/login`,
        method: "POST",
        body: queryArg.login,
      }),
    }),
    logoutCreate: build.mutation<LogoutCreateApiResponse, LogoutCreateApiArg>({
      query: () => ({ url: `/api/logout`, method: "POST" }),
    }),
    notificationsList: build.query<
      NotificationsListApiResponse,
      NotificationsListApiArg
    >({
      query: (queryArg) => ({
        url: `/api/notifications`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          since: queryArg.since,
          user_id: queryArg.userId,
        },
      }),
    }),
    notificationsCreate: build.mutation<
      NotificationsCreateApiResponse,
      NotificationsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/notifications`,
        method: "POST",
        body: queryArg.notificationWrite,
      }),
    }),
    refreshTokenCreate: build.mutation<
      RefreshTokenCreateApiResponse,
      RefreshTokenCreateApiArg
    >({
      query: () => ({ url: `/api/refresh-token`, method: "POST" }),
    }),
    schemaRetrieve: build.query<
      SchemaRetrieveApiResponse,
      SchemaRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/schema/`,
        params: {
          format: queryArg.format,
          lang: queryArg.lang,
        },
      }),
    }),
    sendOtpCreate: build.mutation<
      SendOtpCreateApiResponse,
      SendOtpCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/send-otp`,
        method: "POST",
        body: queryArg.sendOtp,
      }),
    }),
    supportAdminCannedResponsesRetrieve: build.query<
      SupportAdminCannedResponsesRetrieveApiResponse,
      SupportAdminCannedResponsesRetrieveApiArg
    >({
      query: () => ({ url: `/api/support/admin/canned-responses` }),
    }),
    supportAdminCannedResponsesCreate: build.mutation<
      SupportAdminCannedResponsesCreateApiResponse,
      SupportAdminCannedResponsesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/admin/canned-responses`,
        method: "POST",
        body: queryArg.adminCannedResponseCreate,
      }),
    }),
    supportAdminCannedResponsesPartialUpdateByResponseId: build.mutation<
      SupportAdminCannedResponsesPartialUpdateByResponseIdApiResponse,
      SupportAdminCannedResponsesPartialUpdateByResponseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/admin/canned-responses/${queryArg.responseId}`,
        method: "PATCH",
        body: queryArg.patchedAdminCannedResponseUpdate,
      }),
    }),
    supportAdminCannedResponsesDestroyByResponseId: build.mutation<
      SupportAdminCannedResponsesDestroyByResponseIdApiResponse,
      SupportAdminCannedResponsesDestroyByResponseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/admin/canned-responses/${queryArg.responseId}`,
        method: "DELETE",
      }),
    }),
    supportAdminSettingsRetrieve: build.query<
      SupportAdminSettingsRetrieveApiResponse,
      SupportAdminSettingsRetrieveApiArg
    >({
      query: () => ({ url: `/api/support/admin/settings` }),
    }),
    supportAdminSettingsPartialUpdate: build.mutation<
      SupportAdminSettingsPartialUpdateApiResponse,
      SupportAdminSettingsPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/admin/settings`,
        method: "PATCH",
        body: queryArg.patchedAdminSettingsUpdate,
      }),
    }),
    supportAdminTransitionsRetrieve: build.query<
      SupportAdminTransitionsRetrieveApiResponse,
      SupportAdminTransitionsRetrieveApiArg
    >({
      query: () => ({ url: `/api/support/admin/transitions` }),
    }),
    supportAdminTransitionsCreate: build.mutation<
      SupportAdminTransitionsCreateApiResponse,
      SupportAdminTransitionsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/admin/transitions`,
        method: "POST",
        body: queryArg.adminTransitionCreate,
      }),
    }),
    supportAdminTransitionsPartialUpdateByTransitionId: build.mutation<
      SupportAdminTransitionsPartialUpdateByTransitionIdApiResponse,
      SupportAdminTransitionsPartialUpdateByTransitionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/admin/transitions/${queryArg.transitionId}`,
        method: "PATCH",
        body: queryArg.patchedAdminTransitionUpdate,
      }),
    }),
    supportAdminTransitionsDestroyByTransitionId: build.mutation<
      SupportAdminTransitionsDestroyByTransitionIdApiResponse,
      SupportAdminTransitionsDestroyByTransitionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/admin/transitions/${queryArg.transitionId}`,
        method: "DELETE",
      }),
    }),
    supportAttachmentsDownloadRetrieveByAttachmentId: build.query<
      SupportAttachmentsDownloadRetrieveByAttachmentIdApiResponse,
      SupportAttachmentsDownloadRetrieveByAttachmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/attachments/${queryArg.attachmentId}/download`,
      }),
    }),
    supportCannedResponsesRetrieve: build.query<
      SupportCannedResponsesRetrieveApiResponse,
      SupportCannedResponsesRetrieveApiArg
    >({
      query: () => ({ url: `/api/support/canned-responses` }),
    }),
    supportCategoriesRetrieve: build.query<
      SupportCategoriesRetrieveApiResponse,
      SupportCategoriesRetrieveApiArg
    >({
      query: () => ({ url: `/api/support/categories` }),
    }),
    supportCategoriesCreate: build.mutation<
      SupportCategoriesCreateApiResponse,
      SupportCategoriesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/categories`,
        method: "POST",
        body: queryArg.adminCategoryCreate,
      }),
    }),
    supportCategoriesPartialUpdateByCategoryId: build.mutation<
      SupportCategoriesPartialUpdateByCategoryIdApiResponse,
      SupportCategoriesPartialUpdateByCategoryIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/categories/${queryArg.categoryId}`,
        method: "PATCH",
        body: queryArg.patchedAdminCategoryUpdate,
      }),
    }),
    supportCategoriesDestroyByCategoryId: build.mutation<
      SupportCategoriesDestroyByCategoryIdApiResponse,
      SupportCategoriesDestroyByCategoryIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/categories/${queryArg.categoryId}`,
        method: "DELETE",
      }),
    }),
    supportCategoriesOptionsRetrieve: build.query<
      SupportCategoriesOptionsRetrieveApiResponse,
      SupportCategoriesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/categories/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    supportLabelsRetrieve: build.query<
      SupportLabelsRetrieveApiResponse,
      SupportLabelsRetrieveApiArg
    >({
      query: () => ({ url: `/api/support/labels` }),
    }),
    supportLabelsCreate: build.mutation<
      SupportLabelsCreateApiResponse,
      SupportLabelsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/labels`,
        method: "POST",
        body: queryArg.adminLabelCreate,
      }),
    }),
    supportLabelsPartialUpdateByLabelId: build.mutation<
      SupportLabelsPartialUpdateByLabelIdApiResponse,
      SupportLabelsPartialUpdateByLabelIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/labels/${queryArg.labelId}`,
        method: "PATCH",
        body: queryArg.patchedAdminLabelUpdate,
      }),
    }),
    supportLabelsDestroyByLabelId: build.mutation<
      SupportLabelsDestroyByLabelIdApiResponse,
      SupportLabelsDestroyByLabelIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/labels/${queryArg.labelId}`,
        method: "DELETE",
      }),
    }),
    supportLabelsOptionsRetrieve: build.query<
      SupportLabelsOptionsRetrieveApiResponse,
      SupportLabelsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/labels/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    supportPrioritiesRetrieve: build.query<
      SupportPrioritiesRetrieveApiResponse,
      SupportPrioritiesRetrieveApiArg
    >({
      query: () => ({ url: `/api/support/priorities` }),
    }),
    supportPrioritiesCreate: build.mutation<
      SupportPrioritiesCreateApiResponse,
      SupportPrioritiesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/priorities`,
        method: "POST",
        body: queryArg.adminPriorityCreate,
      }),
    }),
    supportPrioritiesPartialUpdateByPriorityId: build.mutation<
      SupportPrioritiesPartialUpdateByPriorityIdApiResponse,
      SupportPrioritiesPartialUpdateByPriorityIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/priorities/${queryArg.priorityId}`,
        method: "PATCH",
        body: queryArg.patchedAdminPriorityUpdate,
      }),
    }),
    supportPrioritiesDestroyByPriorityId: build.mutation<
      SupportPrioritiesDestroyByPriorityIdApiResponse,
      SupportPrioritiesDestroyByPriorityIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/priorities/${queryArg.priorityId}`,
        method: "DELETE",
      }),
    }),
    supportPrioritiesOptionsRetrieve: build.query<
      SupportPrioritiesOptionsRetrieveApiResponse,
      SupportPrioritiesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/priorities/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    supportResourcesTicketsRetrieveByResourceTypeResourceId: build.query<
      SupportResourcesTicketsRetrieveByResourceTypeResourceIdApiResponse,
      SupportResourcesTicketsRetrieveByResourceTypeResourceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/resources/${queryArg.resourceType}/${queryArg.resourceId}/tickets`,
      }),
    }),
    supportStatusesRetrieve: build.query<
      SupportStatusesRetrieveApiResponse,
      SupportStatusesRetrieveApiArg
    >({
      query: () => ({ url: `/api/support/statuses` }),
    }),
    supportStatusesCreate: build.mutation<
      SupportStatusesCreateApiResponse,
      SupportStatusesCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/statuses`,
        method: "POST",
        body: queryArg.adminStatusCreate,
      }),
    }),
    supportStatusesPartialUpdateByStatusId: build.mutation<
      SupportStatusesPartialUpdateByStatusIdApiResponse,
      SupportStatusesPartialUpdateByStatusIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/statuses/${queryArg.statusId}`,
        method: "PATCH",
        body: queryArg.patchedAdminStatusUpdate,
      }),
    }),
    supportStatusesOptionsRetrieve: build.query<
      SupportStatusesOptionsRetrieveApiResponse,
      SupportStatusesOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/statuses/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
          system_state: queryArg.systemState,
        },
      }),
    }),
    supportTeamsRetrieve: build.query<
      SupportTeamsRetrieveApiResponse,
      SupportTeamsRetrieveApiArg
    >({
      query: () => ({ url: `/api/support/teams` }),
    }),
    supportTeamsCreate: build.mutation<
      SupportTeamsCreateApiResponse,
      SupportTeamsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/teams`,
        method: "POST",
        body: queryArg.adminTeamCreate,
      }),
    }),
    supportTeamsPartialUpdateByTeamId: build.mutation<
      SupportTeamsPartialUpdateByTeamIdApiResponse,
      SupportTeamsPartialUpdateByTeamIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/teams/${queryArg.teamId}`,
        method: "PATCH",
        body: queryArg.patchedAdminTeamUpdate,
      }),
    }),
    supportTeamsDestroyByTeamId: build.mutation<
      SupportTeamsDestroyByTeamIdApiResponse,
      SupportTeamsDestroyByTeamIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/teams/${queryArg.teamId}`,
        method: "DELETE",
      }),
    }),
    supportTeamsOptionsRetrieve: build.query<
      SupportTeamsOptionsRetrieveApiResponse,
      SupportTeamsOptionsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/teams/options`,
        params: {
          include_ids: queryArg.includeIds,
          q: queryArg.q,
        },
      }),
    }),
    supportTicketsRetrieve: build.query<
      SupportTicketsRetrieveApiResponse,
      SupportTicketsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets`,
        params: {
          assignee_id: queryArg.assigneeId,
          category_id: queryArg.categoryId,
          created_after: queryArg.createdAfter,
          created_before: queryArg.createdBefore,
          external_reference: queryArg.externalReference,
          impact: queryArg.impact,
          key: queryArg.key,
          label: queryArg.label,
          no_team: queryArg.noTeam,
          ordering: queryArg.ordering,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          parent_key: queryArg.parentKey,
          priority_id: queryArg.priorityId,
          q: queryArg.q,
          requester_id: queryArg.requesterId,
          resolution_code: queryArg.resolutionCode,
          resolution_due_after: queryArg.resolutionDueAfter,
          resolution_due_before: queryArg.resolutionDueBefore,
          resource_id: queryArg.resourceId,
          resource_type: queryArg.resourceType,
          source: queryArg.source,
          status: queryArg.status,
          status_id: queryArg.statusId,
          system_state: queryArg.systemState,
          team_id: queryArg.teamId,
          ticket_type: queryArg.ticketType,
          unassigned: queryArg.unassigned,
          updated_after: queryArg.updatedAfter,
          updated_before: queryArg.updatedBefore,
          urgency: queryArg.urgency,
          watcher_id: queryArg.watcherId,
        },
      }),
    }),
    supportTicketsCreate: build.mutation<
      SupportTicketsCreateApiResponse,
      SupportTicketsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets`,
        method: "POST",
        body: queryArg.ticketCreateRequest,
      }),
    }),
    supportTicketsRetrieveByKey: build.query<
      SupportTicketsRetrieveByKeyApiResponse,
      SupportTicketsRetrieveByKeyApiArg
    >({
      query: (queryArg) => ({ url: `/api/support/tickets/${queryArg.key}` }),
    }),
    supportTicketsPartialUpdateByKey: build.mutation<
      SupportTicketsPartialUpdateByKeyApiResponse,
      SupportTicketsPartialUpdateByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}`,
        method: "PATCH",
        body: queryArg.patchedTicketUpdateRequest,
      }),
    }),
    supportTicketsActionsAssignCreateByKey: build.mutation<
      SupportTicketsActionsAssignCreateByKeyApiResponse,
      SupportTicketsActionsAssignCreateByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/actions/assign`,
        method: "POST",
        body: queryArg.ticketAssignRequest,
      }),
    }),
    supportTicketsActionsSubmitCsatCreateByKey: build.mutation<
      SupportTicketsActionsSubmitCsatCreateByKeyApiResponse,
      SupportTicketsActionsSubmitCsatCreateByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/actions/submit-csat`,
        method: "POST",
        body: queryArg.csatRequest,
      }),
    }),
    supportTicketsActionsTransitionCreateByKey: build.mutation<
      SupportTicketsActionsTransitionCreateByKeyApiResponse,
      SupportTicketsActionsTransitionCreateByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/actions/transition`,
        method: "POST",
        body: queryArg.ticketTransitionRequest,
      }),
    }),
    supportTicketsActivityRetrieveByKey: build.query<
      SupportTicketsActivityRetrieveByKeyApiResponse,
      SupportTicketsActivityRetrieveByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/activity`,
      }),
    }),
    supportTicketsAttachmentsCreateByKey: build.mutation<
      SupportTicketsAttachmentsCreateByKeyApiResponse,
      SupportTicketsAttachmentsCreateByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/attachments`,
        method: "POST",
        body: queryArg.attachmentUploadRequest,
      }),
    }),
    supportTicketsAttachmentsDestroyByKeyAttachmentId: build.mutation<
      SupportTicketsAttachmentsDestroyByKeyAttachmentIdApiResponse,
      SupportTicketsAttachmentsDestroyByKeyAttachmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/attachments/${queryArg.attachmentId}`,
        method: "DELETE",
      }),
    }),
    supportTicketsCommentsRetrieveByKey: build.query<
      SupportTicketsCommentsRetrieveByKeyApiResponse,
      SupportTicketsCommentsRetrieveByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/comments`,
      }),
    }),
    supportTicketsCommentsCreateByKey: build.mutation<
      SupportTicketsCommentsCreateByKeyApiResponse,
      SupportTicketsCommentsCreateByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/comments`,
        method: "POST",
        body: queryArg.commentCreateRequest,
      }),
    }),
    supportTicketsCommentsPartialUpdateByKeyCommentId: build.mutation<
      SupportTicketsCommentsPartialUpdateByKeyCommentIdApiResponse,
      SupportTicketsCommentsPartialUpdateByKeyCommentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/comments/${queryArg.commentId}`,
        method: "PATCH",
        body: queryArg.patchedCommentUpdateRequest,
      }),
    }),
    supportTicketsCommentsDestroyByKeyCommentId: build.mutation<
      SupportTicketsCommentsDestroyByKeyCommentIdApiResponse,
      SupportTicketsCommentsDestroyByKeyCommentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/comments/${queryArg.commentId}`,
        method: "DELETE",
      }),
    }),
    supportTicketsLinksRetrieveByKey: build.query<
      SupportTicketsLinksRetrieveByKeyApiResponse,
      SupportTicketsLinksRetrieveByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/links`,
      }),
    }),
    supportTicketsLinksCreateByKey: build.mutation<
      SupportTicketsLinksCreateByKeyApiResponse,
      SupportTicketsLinksCreateByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/links`,
        method: "POST",
        body: queryArg.ticketLinkRequest,
      }),
    }),
    supportTicketsLinksDestroyByKeyLinkId: build.mutation<
      SupportTicketsLinksDestroyByKeyLinkIdApiResponse,
      SupportTicketsLinksDestroyByKeyLinkIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/links/${queryArg.linkId}`,
        method: "DELETE",
      }),
    }),
    supportTicketsResourcesCreateByKey: build.mutation<
      SupportTicketsResourcesCreateByKeyApiResponse,
      SupportTicketsResourcesCreateByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/resources`,
        method: "POST",
        body: queryArg.linkResourceRequest,
      }),
    }),
    supportTicketsResourcesDestroyByKey: build.mutation<
      SupportTicketsResourcesDestroyByKeyApiResponse,
      SupportTicketsResourcesDestroyByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/resources`,
        method: "DELETE",
      }),
    }),
    supportTicketsWatchersCreateByKey: build.mutation<
      SupportTicketsWatchersCreateByKeyApiResponse,
      SupportTicketsWatchersCreateByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/watchers`,
        method: "POST",
        body: queryArg.watcherRequest,
      }),
    }),
    supportTicketsWatchersDestroyByKey: build.mutation<
      SupportTicketsWatchersDestroyByKeyApiResponse,
      SupportTicketsWatchersDestroyByKeyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/${queryArg.key}/watchers`,
        method: "DELETE",
      }),
    }),
    supportTicketsStatsRetrieve: build.query<
      SupportTicketsStatsRetrieveApiResponse,
      SupportTicketsStatsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/support/tickets/stats`,
        params: {
          days: queryArg.days,
        },
      }),
    }),
    userGroupsRetrieve: build.query<
      UserGroupsRetrieveApiResponse,
      UserGroupsRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/user-groups`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    userGroupsUsersRetrieveByGroupId: build.query<
      UserGroupsUsersRetrieveByGroupIdApiResponse,
      UserGroupsUsersRetrieveByGroupIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/user-groups/${queryArg.groupId}/users`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
        },
      }),
    }),
    usersRetrieve: build.query<UsersRetrieveApiResponse, UsersRetrieveApiArg>({
      query: (queryArg) => ({
        url: `/api/users`,
        params: {
          page: queryArg.page,
          page_size: queryArg.pageSize,
          username: queryArg.username,
        },
      }),
    }),
    usersRetrieveById: build.query<
      UsersRetrieveByIdApiResponse,
      UsersRetrieveByIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/users/${queryArg.id}` }),
    }),
    usersPartialUpdateById: build.mutation<
      UsersPartialUpdateByIdApiResponse,
      UsersPartialUpdateByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.id}`,
        method: "PATCH",
        body: queryArg.patchedUpdateUser,
      }),
    }),
    usersAvatarRetrieve: build.query<
      UsersAvatarRetrieveApiResponse,
      UsersAvatarRetrieveApiArg
    >({
      query: () => ({ url: `/api/users/avatar` }),
    }),
    usersAvatarCreate: build.mutation<
      UsersAvatarCreateApiResponse,
      UsersAvatarCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/avatar`,
        method: "POST",
        body: queryArg.userAvatarUpload,
      }),
    }),
    usersAvatarDestroy: build.mutation<
      UsersAvatarDestroyApiResponse,
      UsersAvatarDestroyApiArg
    >({
      query: () => ({ url: `/api/users/avatar`, method: "DELETE" }),
    }),
    usersMeRetrieve: build.query<
      UsersMeRetrieveApiResponse,
      UsersMeRetrieveApiArg
    >({
      query: () => ({ url: `/api/users/me` }),
    }),
    getInternalChanges: build.query<
      GetInternalChangesApiResponse,
      GetInternalChangesApiArg
    >({
      query: (queryArg) => ({
        url: `/internal/changes/${queryArg.entity}`,
        params: {
          epoch: queryArg.epoch,
          limit: queryArg.limit,
          since: queryArg.since,
          wait: queryArg.wait,
        },
      }),
    }),
    getInternalDigest: build.query<
      GetInternalDigestApiResponse,
      GetInternalDigestApiArg
    >({
      query: (queryArg) => ({ url: `/internal/digest/${queryArg.entity}` }),
    }),
    getInternalInfo: build.query<
      GetInternalInfoApiResponse,
      GetInternalInfoApiArg
    >({
      query: () => ({ url: `/internal/info` }),
    }),
    getInternalSnapshot: build.query<
      GetInternalSnapshotApiResponse,
      GetInternalSnapshotApiArg
    >({
      query: (queryArg) => ({
        url: `/internal/snapshot/${queryArg.entity}`,
        params: {
          after: queryArg.after,
          limit: queryArg.limit,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as generatedApi };
export type AgentCheckInBookingApiResponse =
  /** status 200 Check-in result */ AgentBookingCheckInResponse;
export type AgentCheckInBookingApiArg = {
  agentBookingValidationRequest: AgentBookingValidationRequest;
};
export type AgentCompleteBookingApiResponse =
  /** status 200 End result */ AgentBookingCompleteResponse;
export type AgentCompleteBookingApiArg = {
  agentBookingValidationRequest: AgentBookingValidationRequest;
};
export type AgentExtendBookingApiResponse =
  /** status 200 Extension result */ AgentBookingExtendResponse;
export type AgentExtendBookingApiArg = {
  agentBookingExtendRequest: AgentBookingExtendRequest;
};
export type AgentValidateBookingApiResponse =
  /** status 200 Eligibility */ AgentBookingValidationResponse;
export type AgentValidateBookingApiArg = {
  agentBookingValidationRequest: AgentBookingValidationRequest;
};
export type AgentDeviceObservationsActionsReportCreateApiResponse =
  /** status 200  */ AgentDeviceObservationsObservationSerializersObservationAcknowledgmentDetailResponseRead;
export type AgentDeviceObservationsActionsReportCreateApiArg = {
  /** Durable UUID batch key; reuse on retry with the same content. */
  "Idempotency-Key": string;
  deviceObservationReport: DeviceObservationReport;
};
export type EnrollAgentApiResponse =
  /** status 201 Agent successfully enrolled */ AgentDetailResponseRead;
export type EnrollAgentApiArg = {
  enrollAgentRequest: EnrollAgentRequest;
};
export type AgentReportActivityApiResponse =
  /** status 200 Activity recorded */ AgentActivityResponseRead;
export type AgentReportActivityApiArg = {
  patchedAgentActivityReport: PatchedAgentActivityReport;
};
export type AgentHeartbeatApiResponse =
  /** status 200 Heartbeat acknowledged */ AgentHeartbeatResponse;
export type AgentHeartbeatApiArg = {
  agentHeartbeatRequest: AgentHeartbeatRequest;
};
export type GetAgentInfoApiResponse =
  /** status 200 Server agent metadata */ AgentInfoResponse;
export type GetAgentInfoApiArg = void;
export type AgentMonitoringPolicyRetrieveApiResponse =
  /** status 200  */ AgentMonitoringPolicyObservationSerializersMonitoringPolicyDetailResponse;
export type AgentMonitoringPolicyRetrieveApiArg = void;
export type AgentRecordSessionLogApiResponse =
  | /** status 200 Same event already stored; no change */ AgentSessionLogResponseRead
  | /** status 201 Session stored */ AgentSessionLogResponseRead;
export type AgentRecordSessionLogApiArg = {
  agentSessionLogReport: AgentSessionLogReport;
};
export type AadLoginCreateApiResponse =
  /** status 200  */ AadLoginSerializerAadLoginResponseDetailResponse;
export type AadLoginCreateApiArg = {
  aadLogin: AadLoginWrite;
};
export type ListAgentsApiResponse =
  /** status 200 Page of agents */ AgentListResponseRead;
export type ListAgentsApiArg = {
  /** Comma-separated computing equipment ids (1..100); returns only their agents. */
  equipment?: string;
  /** Computing equipment UID; returns only its agents. */
  equipmentUid?: string;
  /** Page number (>= 1) */
  page?: number;
  /** Page size (1..100, default 25) */
  pageSize?: number;
  /** Comma-separated agent states: pending, active, revoked, decommissioned. */
  state?: string;
};
export type CreateAgentGrantApiResponse =
  /** status 201 Enrollment grant issued */ EnrollmentGrantIssuedResponse;
export type CreateAgentGrantApiArg = {
  createAgentGrantRequest: CreateAgentGrantRequest;
};
export type GetAgentDetailApiResponse =
  /** status 200 Agent detail */ AgentDetailResponseRead;
export type GetAgentDetailApiArg = {
  id: number;
};
export type DecommissionAgentApiResponse =
  /** status 200 Agent decommissioned */ AgentDetailResponseRead;
export type DecommissionAgentApiArg = {
  id: number;
  body: any;
};
export type RevokeAgentApiResponse =
  /** status 200 Agent revoked */ AgentDetailResponseRead;
export type RevokeAgentApiArg = {
  id: number;
  body: any;
};
export type ListAgentGrantsApiResponse =
  /** status 200 Page of grants */ EnrollmentGrantListResponseRead;
export type ListAgentGrantsApiArg = {
  id: number;
  /** Page number (>= 1) */
  page?: number;
  /** Page size (1..100, default 25) */
  pageSize?: number;
};
export type CreateAgentRecoveryGrantApiResponse =
  /** status 201 Grant issued */ EnrollmentGrantIssuedResponse;
export type CreateAgentRecoveryGrantApiArg = {
  id: number;
  createGrantForAgentRequest: CreateGrantForAgentRequest;
};
export type RevokeAgentGrantApiResponse =
  /** status 200 Grant revoked */ EnrollmentGrantResponseRead;
export type RevokeAgentGrantApiArg = {
  grantId: number;
  id: number;
};
export type CsrfTokenRetrieveApiResponse =
  /** status 200  */ CsrfTokenSerializerCsrfTokenResponseDetailResponse;
export type CsrfTokenRetrieveApiArg = void;
export type LabsAnalyticsBenchGroupRetrieveApiResponse =
  /** status 200  */ BenchGroupSummarySerializersBenchGroupSummaryListResponse;
export type LabsAnalyticsBenchGroupRetrieveApiArg = void;
export type LabsAnalyticsBookedVsUsedRetrieveApiResponse =
  /** status 200  */ BookedVsUsedAnalyticsSerializersBookedVsUsedDetailResponseRead;
export type LabsAnalyticsBookedVsUsedRetrieveApiArg = {
  fromDateTime: string;
  toDateTime: string;
};
export type LabsAnalyticsBookingRetrieveApiResponse =
  /** status 200  */ BookingCountAnalyticsResponse;
export type LabsAnalyticsBookingRetrieveApiArg = {
  /** First local day to include (YYYY-MM-DD, inclusive). Requires `unit`. For `unit=day` the default is 30 days before `date_before`. */
  dateAfter?: string;
  /** Local day to stop before (YYYY-MM-DD, exclusive). Requires `unit`. For `unit=day` the default is tomorrow, so today is included; a range covers at most 366 days. */
  dateBefore?: string;
  /** * `day` - day
   * `week` - week
   * `month` - month
   * `quarter` - quarter
   * `year` - year */
  unit?: "day" | "week" | "month" | "quarter" | "year";
};
export type LabsAnalyticsEquipmentAvailabilityRetrieveApiResponse =
  /** status 200  */ EquipmentAvailabilityAnalyticsSerializersEquipmentAvailabilityDetailResponseRead;
export type LabsAnalyticsEquipmentAvailabilityRetrieveApiArg = {
  fromDateTime: string;
  toDateTime: string;
};
export type LabsAnalyticsFinanceExpenseTypeBreakdownRetrieveApiResponse =
  /** status 200  */ FinanceBreakdownAnalyticsSerializersFinanceBreakdownDetailResponseRead;
export type LabsAnalyticsFinanceExpenseTypeBreakdownRetrieveApiArg = {
  /** Explicit three-letter currency; no FX conversion. */
  currency: string;
  /** Inclusive last calendar month (YYYY-MM); maximum 24 months. */
  endMonth: string;
  /** Inclusive first calendar month (YYYY-MM). */
  startMonth: string;
  /** IANA zone for procurement timestamps and midnight boundaries. Expense paid_at dates are not shifted. */
  timezone?: string;
};
export type LabsAnalyticsFinanceMonthlyTrendsRetrieveApiResponse =
  /** status 200  */ FinanceMonthlyTrendsAnalyticsSerializersFinanceMonthlyTrendsDetailResponse;
export type LabsAnalyticsFinanceMonthlyTrendsRetrieveApiArg = {
  /** Explicit three-letter currency; no FX conversion. */
  currency: string;
  /** Inclusive last calendar month (YYYY-MM); maximum 24 months. */
  endMonth: string;
  /** Inclusive first calendar month (YYYY-MM). */
  startMonth: string;
  /** IANA zone for procurement timestamps and midnight boundaries. Expense paid_at dates are not shifted. */
  timezone?: string;
};
export type LabsAnalyticsFinanceSummaryRetrieveApiResponse =
  /** status 200  */ FinanceSummaryAnalyticsSerializersFinanceSummaryDetailResponse;
export type LabsAnalyticsFinanceSummaryRetrieveApiArg = {
  /** Explicit three-letter currency; no FX conversion. */
  currency: string;
  /** Inclusive last calendar month (YYYY-MM); maximum 24 months. */
  endMonth: string;
  /** Inclusive first calendar month (YYYY-MM). */
  startMonth: string;
  /** IANA zone for procurement timestamps and midnight boundaries. Expense paid_at dates are not shifted. */
  timezone?: string;
};
export type LabsAnalyticsLabCountRetrieveApiResponse =
  /** status 200  */ LabCountAnalyticsResponse;
export type LabsAnalyticsLabCountRetrieveApiArg = {
  /** First local day to include (YYYY-MM-DD, inclusive). Requires `unit`. For `unit=day` the default is 30 days before `date_before`. */
  dateAfter?: string;
  /** Local day to stop before (YYYY-MM-DD, exclusive). Requires `unit`. For `unit=day` the default is tomorrow, so today is included; a range covers at most 366 days. */
  dateBefore?: string;
  /** * `day` - day
   * `week` - week
   * `month` - month
   * `quarter` - quarter
   * `year` - year */
  unit?: "day" | "week" | "month" | "quarter" | "year";
};
export type LabsAnalyticsLabEfficiencyRetrieveApiResponse =
  /** status 200  */ LabEfficiencySerializersLabEfficiencyListResponse;
export type LabsAnalyticsLabEfficiencyRetrieveApiArg = {
  fromDateTime: string;
  order?: string;
  toDateTime: string;
  top?: number;
};
export type LabsAnalyticsLabEquipmentStatusRetrieveApiResponse =
  /** status 200  */ EquipmentStatusSummarySerializersEquipmentStatusSummaryListResponse;
export type LabsAnalyticsLabEquipmentStatusRetrieveApiArg = void;
export type LabsAnalyticsLabUsageByTimeframeRetrieveApiResponse =
  /** status 200  */ LabUsageTimeframeSerializersLabUsageTimeframeListResponse;
export type LabsAnalyticsLabUsageByTimeframeRetrieveApiArg = {
  fromDateTime: string;
  toDateTime: string;
};
export type LabsAnalyticsLabVisitsRetrieveApiResponse =
  /** status 200  */ LabVisitAnalyticsResponse;
export type LabsAnalyticsLabVisitsRetrieveApiArg = {
  /** First local day to include (YYYY-MM-DD, inclusive). Requires `unit`. For `unit=day` the default is 30 days before `date_before`. */
  dateAfter?: string;
  /** Local day to stop before (YYYY-MM-DD, exclusive). Requires `unit`. For `unit=day` the default is tomorrow, so today is included; a range covers at most 366 days. */
  dateBefore?: string;
  /** * `day` - day
   * `week` - week
   * `month` - month
   * `quarter` - quarter
   * `year` - year */
  unit?: "day" | "week" | "month" | "quarter" | "year";
};
export type LabsAnalyticsLabVisitsCreateApiResponse =
  /** status 200  */ LabVisitCreatedSerializersLabVisitLogResponseDetailResponse;
export type LabsAnalyticsLabVisitsCreateApiArg = {
  labVisitLogCreate: LabVisitLogCreate;
};
export type LabsAnalyticsProjectUsageRetrieveApiResponse =
  /** status 200  */ ProjectUsageSerializersProjectUsageListResponse;
export type LabsAnalyticsProjectUsageRetrieveApiArg = {
  fromDateTime: string;
  order?: string;
  toDateTime: string;
  top?: number;
};
export type LabsAnalyticsStorageQuotaRetrieveApiResponse =
  /** status 200  */ StorageQuotaListSerializersStorageQuotaListListResponse;
export type LabsAnalyticsStorageQuotaRetrieveApiArg = {
  logDate: string;
  top?: number;
};
export type LabsAnalyticsStorageQuotaCreateApiResponse =
  /** status 200  */ StorageQuotaCreatedSerializersStorageQuotaListDetailResponse;
export type LabsAnalyticsStorageQuotaCreateApiArg = {
  storageQuotaCreate: StorageQuotaCreate;
};
export type LabsAnalyticsUserBookingEfficiencyRetrieveApiResponse =
  /** status 200  */ UserBookingEfficiencySerializersUserBookingEfficiencyListResponse;
export type LabsAnalyticsUserBookingEfficiencyRetrieveApiArg = {
  fromDateTime: string;
  order?: string;
  toDateTime: string;
  top?: number;
};
export type LabsAnalyticsUserCountRetrieveApiResponse =
  /** status 200  */ UserCountAnalyticsResponse;
export type LabsAnalyticsUserCountRetrieveApiArg = {
  /** First local day to include (YYYY-MM-DD, inclusive). Requires `unit`. For `unit=day` the default is 30 days before `date_before`. */
  dateAfter?: string;
  /** Local day to stop before (YYYY-MM-DD, exclusive). Requires `unit`. For `unit=day` the default is tomorrow, so today is included; a range covers at most 366 days. */
  dateBefore?: string;
  /** * `day` - day
   * `week` - week
   * `month` - month
   * `quarter` - quarter
   * `year` - year */
  unit?: "day" | "week" | "month" | "quarter" | "year";
};
export type LabsAnalyticsUserLabUsageRetrieveApiResponse =
  /** status 200  */ UserLabUsageSerializersUserLabUsageListResponse;
export type LabsAnalyticsUserLabUsageRetrieveApiArg = {
  fromDateTime: string;
  order?: string;
  toDateTime: string;
  top?: number;
};
export type LabsAuditCatalogRetrieveApiResponse =
  /** status 200  */ AuditCatalogResponseRead;
export type LabsAuditCatalogRetrieveApiArg = {
  /** Return only rows created, changed or deleted at or after this time. Omit for a full download. */
  changedSince?: string;
  /** Opaque next_cursor from the previous page. Send it alone; it carries the filter and page size. */
  cursor?: string;
  pageSize?: number;
};
export type LabsAuditsRetrieveApiResponse =
  /** status 200  */ AllResourceAuditListSerializersResourceAuditItemPaginatedResponseRead;
export type LabsAuditsRetrieveApiArg = {
  auditorId?: number;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
  resourceType?: string;
  /** * `PASS` - PASS
   * `FAIL` - FAIL
   * `NOT_ASSESSED` - NOT_ASSESSED
   * `OK` - OK
   * `NOK` - NOK */
  result?: "PASS" | "FAIL" | "NOT_ASSESSED" | "OK" | "NOK";
};
export type LabsAuditsRetrieveByAuditIdApiResponse =
  /** status 200  */ ResourceAuditDetailSerializersResourceAuditItemDetailResponseRead;
export type LabsAuditsRetrieveByAuditIdApiArg = {
  auditId: number;
};
export type LabsAuditsPartialUpdateByAuditIdApiResponse =
  /** status 200  */ ResourceAuditDetailSerializersResourceAuditItemDetailResponseRead;
export type LabsAuditsPartialUpdateByAuditIdApiArg = {
  auditId: number;
  patchedUpdateResourceAuditRequest: PatchedUpdateResourceAuditRequest;
};
export type LabsAuditsDestroyByAuditIdApiResponse = unknown;
export type LabsAuditsDestroyByAuditIdApiArg = {
  auditId: number;
};
export type LabsBenchBookingsRetrieveApiResponse =
  /** status 200  */ BenchBookingListSerializersBenchBookingPaginatedResponseRead;
export type LabsBenchBookingsRetrieveApiArg = {
  approvalStatus?: string;
  benchId?: number;
  bookingCode?: string;
  creator?: string;
  creatorId?: number;
  /** Comma-separated ordering fields: starts_at, ends_at, created_at, id; prefix with '-' for descending. Defaults to -starts_at,-id. An id tie-breaker is added when omitted. */
  ordering?: string;
  page?: number;
  pageSize?: number;
  projectId?: number;
  q?: string;
  /** Inclusive lower bound. Accepts strict YYYY-MM-DD in Django TIME_ZONE or an offset-aware RFC3339 datetime (YYYY-MM-DDTHH:MM:SS[.fraction](Z|±HH:MM)). */
  startsAtAfter?: string;
  /** Exclusive upper bound. Accepts strict YYYY-MM-DD in Django TIME_ZONE or an offset-aware RFC3339 datetime (YYYY-MM-DDTHH:MM:SS[.fraction](Z|±HH:MM)). A date-only value is midnight at the start of that date; to include November 2–8, use starts_at_after=2026-11-02 and starts_at_before=2026-11-09. */
  startsAtBefore?: string;
  status?: string;
  /** * `my_booking` - my_booking
   * `booking_calendar` - booking_calendar */
  viewSide?: "my_booking" | "booking_calendar";
};
export type LabsBenchBookingsCreateApiResponse =
  /** status 201  */ BenchBookingCreateSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsCreateApiArg = {
  benchBookingCreate: BenchBookingCreate;
};
export type LabsBenchBookingsRetrieveByBookingIdApiResponse =
  /** status 200  */ BenchBookingDetailSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsRetrieveByBookingIdApiArg = {
  bookingId: number;
};
export type LabsBenchBookingsPartialUpdateByBookingIdApiResponse =
  /** status 200  */ BenchBookingUpdateSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsPartialUpdateByBookingIdApiArg = {
  bookingId: number;
  patchedBenchBookingUpdate: PatchedBenchBookingUpdate;
};
export type LabsBenchBookingsActionsApproveCreateByBookingIdApiResponse =
  /** status 200  */ BenchBookingApproveActionSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsActionsApproveCreateByBookingIdApiArg = {
  /** Required UUID. A matching completed request replays its original response for 24 hours; reuse with a different request returns 422. */
  "Idempotency-Key": string;
  bookingId: number;
};
export type LabsBenchBookingsActionsCancelCreateByBookingIdApiResponse =
  /** status 200  */ BenchBookingCancelActionSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsActionsCancelCreateByBookingIdApiArg = {
  bookingId: number;
  benchBookingCancelAction: BenchBookingCancelAction;
};
export type LabsBenchBookingsActionsCompleteCreateByBookingIdApiResponse =
  /** status 200  */ BenchBookingCompleteActionSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsActionsCompleteCreateByBookingIdApiArg = {
  bookingId: number;
};
export type LabsBenchBookingsActionsRejectCreateByBookingIdApiResponse =
  /** status 200  */ BenchBookingRejectActionSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsActionsRejectCreateByBookingIdApiArg = {
  /** Required UUID. A matching completed request replays its original response for 24 hours; reuse with a different request returns 422. */
  "Idempotency-Key": string;
  bookingId: number;
  benchBookingRejectAction: BenchBookingRejectAction;
};
export type LabsBenchBookingsCodeRetrieveByBookingCodeApiResponse =
  /** status 200  */ BenchBookingDetailByCodeSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsCodeRetrieveByBookingCodeApiArg = {
  bookingCode: string;
};
export type LabsBenchBookingsCodePartialUpdateByBookingCodeApiResponse =
  /** status 200  */ BenchBookingUpdateByCodeSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsCodePartialUpdateByBookingCodeApiArg = {
  bookingCode: string;
  patchedBenchBookingUpdate: PatchedBenchBookingUpdate;
};
export type LabsBenchBookingsCodeActionsCancelCreateByBookingCodeApiResponse =
  /** status 200  */ BenchBookingCancelByCodeActionSerializersBenchBookingDetailResponseRead;
export type LabsBenchBookingsCodeActionsCancelCreateByBookingCodeApiArg = {
  bookingCode: string;
  benchBookingCancelAction: BenchBookingCancelAction;
};
export type LabsBenchBookingsReferenceDataProjectsRetrieveApiResponse =
  /** status 200  */ LabProjectReferenceListSerializersLabProjectCatalogRecordPaginatedResponseRead;
export type LabsBenchBookingsReferenceDataProjectsRetrieveApiArg = {
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsBenchBookingsReferenceDataProjectsCreateApiResponse =
  /** status 201  */ LabProjectReferenceCreateSerializersLabProjectCatalogRecordDetailResponseRead;
export type LabsBenchBookingsReferenceDataProjectsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  labProjectCatalogCreate: LabProjectCatalogCreate;
};
export type LabsBenchBookingsReferenceDataProjectsRetrieveByReferenceIdApiResponse =
  /** status 200  */ LabProjectReferenceDetailSerializersLabProjectCatalogRecordDetailResponseRead;
export type LabsBenchBookingsReferenceDataProjectsRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsBenchGroupsRetrieveApiResponse =
  /** status 200  */ BenchReferenceListSerializersBenchReferenceDataPaginatedResponseRead;
export type LabsBenchGroupsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsBenchGroupsCreateApiResponse =
  /** status 201  */ BenchGroupCreateSerializersBenchGroupDetailResponseRead;
export type LabsBenchGroupsCreateApiArg = {
  benchReferenceWrite: BenchReferenceWrite;
};
export type LabsBenchGroupsRetrieveByReferenceIdApiResponse =
  /** status 200  */ BenchGroupDetailSerializersBenchGroupDetailResponseRead;
export type LabsBenchGroupsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsBenchGroupsPartialUpdateByReferenceIdApiResponse =
  /** status 200  */ BenchGroupUpdateSerializersBenchGroupDetailResponseRead;
export type LabsBenchGroupsPartialUpdateByReferenceIdApiArg = {
  referenceId: number;
  patchedBenchReferenceWrite: PatchedBenchReferenceWrite;
};
export type LabsBenchGroupsDestroyByReferenceIdApiResponse = unknown;
export type LabsBenchGroupsDestroyByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsBenchGroupsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsBenchGroupsOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsBenchTypesRetrieveApiResponse =
  /** status 200  */ BenchReferenceListSerializersBenchReferenceDataPaginatedResponseRead;
export type LabsBenchTypesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsBenchTypesCreateApiResponse =
  /** status 201  */ BenchTypeCreateSerializersBenchTypeDetailResponseRead;
export type LabsBenchTypesCreateApiArg = {
  benchReferenceWrite: BenchReferenceWrite;
};
export type LabsBenchTypesRetrieveByReferenceIdApiResponse =
  /** status 200  */ BenchTypeDetailSerializersBenchTypeDetailResponseRead;
export type LabsBenchTypesRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsBenchTypesPartialUpdateByReferenceIdApiResponse =
  /** status 200  */ BenchTypeUpdateSerializersBenchTypeDetailResponseRead;
export type LabsBenchTypesPartialUpdateByReferenceIdApiArg = {
  referenceId: number;
  patchedBenchReferenceWrite: PatchedBenchReferenceWrite;
};
export type LabsBenchTypesDestroyByReferenceIdApiResponse = unknown;
export type LabsBenchTypesDestroyByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsBenchTypesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsBenchTypesOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsBenchesRetrieveApiResponse =
  /** status 200  */ BenchListSerializersBenchPaginatedResponseRead;
export type LabsBenchesRetrieveApiArg = {
  /** Comma-separated values; OR within this filter. */
  activityStatus?: string;
  /** Comma-separated values; OR within this filter. */
  benchGroupId?: string;
  /** Comma-separated values; OR within this filter. */
  condition?: string;
  createdAtAfter?: string;
  createdAtBefore?: string;
  favorite?: boolean;
  /** Comma-separated values; OR within this filter. */
  groupId?: string;
  /** Comma-separated values; OR within this filter. */
  id?: string;
  /** Comma-separated values; OR within this filter. */
  lifecycleStatus?: string;
  ordering?: string;
  /** Comma-separated values; OR within this filter. */
  ownerId?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  /** Comma-separated values; OR within this filter. */
  setupLocationId?: string;
  /** Comma-separated values; OR within this filter. */
  status?: string;
  /** Comma-separated values; OR within this filter. */
  typeId?: string;
};
export type LabsBenchesCreateApiResponse =
  /** status 201  */ BenchCreateSerializersBenchDetailResponseRead;
export type LabsBenchesCreateApiArg = {
  benchCreate: BenchCreate;
};
export type LabsBenchesRetrieveByBenchIdApiResponse =
  /** status 200  */ BenchDetailSerializersBenchResourceDetailDetailResponseRead;
export type LabsBenchesRetrieveByBenchIdApiArg = {
  benchId: number;
};
export type LabsBenchesUpdateByBenchIdApiResponse =
  /** status 200  */ BenchReplaceSerializersBenchDetailResponseRead;
export type LabsBenchesUpdateByBenchIdApiArg = {
  benchId: number;
  benchUpdate: BenchUpdate;
};
export type LabsBenchesPartialUpdateByBenchIdApiResponse =
  /** status 200  */ BenchUpdateSerializersBenchDetailResponseRead;
export type LabsBenchesPartialUpdateByBenchIdApiArg = {
  benchId: number;
  patchedBenchUpdate: PatchedBenchUpdate;
};
export type LabsBenchesDestroyByBenchIdApiResponse = unknown;
export type LabsBenchesDestroyByBenchIdApiArg = {
  benchId: number;
};
export type LabsBenchesActionsChangeLifecycleCreateByBenchIdApiResponse =
  /** status 200  */ BenchLifecycleChangeSerializersBenchDetailResponseRead;
export type LabsBenchesActionsChangeLifecycleCreateByBenchIdApiArg = {
  benchId: number;
  benchLifecycleWrite: BenchLifecycleWrite;
};
export type LabsBenchesActionsFavoriteCreateByBenchIdApiResponse =
  /** status 200  */ BenchFavoriteSerializersBenchFavoriteDetailResponseRead;
export type LabsBenchesActionsFavoriteCreateByBenchIdApiArg = {
  benchId: number;
};
export type LabsBenchesActionsFavoriteDestroyByBenchIdApiResponse = unknown;
export type LabsBenchesActionsFavoriteDestroyByBenchIdApiArg = {
  benchId: number;
};
export type LabsBenchesActionsPlaceCreateByBenchIdApiResponse =
  /** status 200  */ BenchPlaceActionSerializersBenchDetailResponseRead;
export type LabsBenchesActionsPlaceCreateByBenchIdApiArg = {
  benchId: number;
  benchPlacement: BenchPlacement;
};
export type LabsBenchesActionsPlacePartialUpdateByBenchIdApiResponse =
  /** status 200  */ BenchPlacementSerializersBenchDetailResponseRead;
export type LabsBenchesActionsPlacePartialUpdateByBenchIdApiArg = {
  benchId: number;
  patchedBenchPlacement: PatchedBenchPlacement;
};
export type LabsBenchesEquipmentRetrieveByBenchIdApiResponse =
  /** status 200  */ BenchEquipmentListSerializersBenchSetupEquipmentPaginatedResponseRead;
export type LabsBenchesEquipmentRetrieveByBenchIdApiArg = {
  benchId: number;
  page?: number;
  pageSize?: number;
};
export type LabsBenchesImageRetrieveByBenchIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsBenchesImageRetrieveByBenchIdApiArg = {
  benchId: number;
};
export type LabsBenchesImageUpdateByBenchIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsBenchesImageUpdateByBenchIdApiArg = {
  benchId: number;
  resourceImageUpload: ResourceImageUpload;
};
export type LabsBenchesImageDestroyByBenchIdApiResponse = unknown;
export type LabsBenchesImageDestroyByBenchIdApiArg = {
  benchId: number;
};
export type LabsBenchesProfileRetrieveByIdApiResponse =
  /** status 200  */ LabProfileSerializersLabProfileDetailResponse;
export type LabsBenchesProfileRetrieveByIdApiArg = {
  endDate?: string;
  id: number;
  startDate?: string;
};
export type LabsBenchesWeeklyUsageRetrieveByIdApiResponse =
  /** status 200  */ LabWeeklyUsageSerializersWeeklyUsageSlotListResponse;
export type LabsBenchesWeeklyUsageRetrieveByIdApiArg = {
  id: number;
};
export type LabsBenchesMappingRetrieveByResourceIdApiResponse =
  /** status 200  */ ResourceMappingResponse;
export type LabsBenchesMappingRetrieveByResourceIdApiArg = {
  benchesCursor?: string;
  equipmentCursor?: string;
  licenseAssignmentsCursor?: string;
  licensesCursor?: string;
  pageSize?: number;
  resourceId: number;
  roomSlotsCursor?: string;
  roomsCursor?: string;
  stationSlotsCursor?: string;
  stationsCursor?: string;
};
export type LabsBenchesBookingChoicesRetrieveApiResponse =
  /** status 200  */ BookingBenchChoicesRead;
export type LabsBenchesBookingChoicesRetrieveApiArg = {
  /** When true, only benches with a computer (monitored equipment) placed on them. Benches named in include_ids are still returned. */
  hasComputing?: boolean | null;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsBenchesFiltersRetrieveApiResponse =
  /** status 200  */ BenchFiltersFilteringFilterMetadataDetailResponse;
export type LabsBenchesFiltersRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsBenchesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsBenchesOptionsRetrieveApiArg = {
  benchGroupId?: number;
  favorite?: boolean;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  lifecycleStatus?: string;
  /** Search text (1 to 100 characters). */
  q?: string;
  setupLocationId?: number;
  typeId?: number;
};
export type LabsBenchesReferenceDataRetrieveApiResponse =
  /** status 200  */ BenchReferenceDataSerializersBenchReferenceDataDetailResponseRead;
export type LabsBenchesReferenceDataRetrieveApiArg = void;
export type LabsBenchesReferenceDataGroupsRetrieveApiResponse =
  /** status 200  */ BenchGroupReferenceListSerializersBenchGroupCatalogRecordPaginatedResponseRead;
export type LabsBenchesReferenceDataGroupsRetrieveApiArg = {
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsBenchesReferenceDataGroupsCreateApiResponse =
  /** status 201  */ BenchGroupReferenceCreateSerializersBenchGroupCatalogRecordDetailResponseRead;
export type LabsBenchesReferenceDataGroupsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  benchGroupCatalogCreate: BenchGroupCatalogCreate;
};
export type LabsBenchesReferenceDataGroupsRetrieveByReferenceIdApiResponse =
  /** status 200  */ BenchGroupReferenceDetailSerializersBenchGroupCatalogRecordDetailResponseRead;
export type LabsBenchesReferenceDataGroupsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsBenchesReferenceDataTypesRetrieveApiResponse =
  /** status 200  */ BenchTypeReferenceListSerializersBenchTypeCatalogRecordPaginatedResponseRead;
export type LabsBenchesReferenceDataTypesRetrieveApiArg = {
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsBenchesReferenceDataTypesCreateApiResponse =
  /** status 201  */ BenchTypeReferenceCreateSerializersBenchTypeCatalogRecordDetailResponseRead;
export type LabsBenchesReferenceDataTypesCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  benchTypeCatalogCreate: BenchTypeCatalogCreate;
};
export type LabsBenchesReferenceDataTypesRetrieveByReferenceIdApiResponse =
  /** status 200  */ BenchTypeReferenceDetailSerializersBenchTypeCatalogRecordDetailResponseRead;
export type LabsBenchesReferenceDataTypesRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsBenchesStatusSummaryRetrieveApiResponse =
  /** status 200  */ BenchStatusSummaryDataSerializersBenchStatusSummaryDetailResponse;
export type LabsBenchesStatusSummaryRetrieveApiArg = void;
export type LabsBuildingsRetrieveApiResponse =
  /** status 200  */ BuildingCatalogListGeoSerializersBuildingPaginatedResponseRead;
export type LabsBuildingsRetrieveApiArg = {
  cityId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  page?: number;
  pageSize?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsBuildingsRetrieveByBuildingIdApiResponse =
  /** status 200  */ BuildingCatalogDetailGeoSerializersBuildingDetailResponseRead;
export type LabsBuildingsRetrieveByBuildingIdApiArg = {
  buildingId: number;
};
export type LabsBuildingsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsBuildingsOptionsRetrieveApiArg = {
  cityId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsCitiesRetrieveApiResponse =
  /** status 200  */ CityCatalogListGeoSerializersCityPaginatedResponseRead;
export type LabsCitiesRetrieveApiArg = {
  countryId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  page?: number;
  pageSize?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsCitiesRetrieveByCityIdApiResponse =
  /** status 200  */ CityCatalogDetailGeoSerializersCityDetailResponseRead;
export type LabsCitiesRetrieveByCityIdApiArg = {
  cityId: number;
};
export type LabsCitiesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsCitiesOptionsRetrieveApiArg = {
  countryId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsCountriesRetrieveApiResponse =
  /** status 200  */ CountryCatalogListGeoSerializersCountryPaginatedResponseRead;
export type LabsCountriesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsCountriesRetrieveByCountryIdApiResponse =
  /** status 200  */ CountryCatalogDetailGeoSerializersCountryDetailResponseRead;
export type LabsCountriesRetrieveByCountryIdApiArg = {
  countryId: number;
};
export type LabsCountriesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsCountriesOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsDashboardRetrieveApiResponse =
  /** status 200  */ DashboardBenchListSerializersDashboardBenchPaginatedResponseRead;
export type LabsDashboardRetrieveApiArg = {
  /** Filter by computing activity status (free, active, inactive, offline, maintaining).
    
    * `offline` - Offline
    * `free` - Free
    * `active` - Active
    * `inactive` - Inactive
    * `maintaining` - Maintaining */
  activityStatus?: "offline" | "free" | "active" | "inactive" | "maintaining";
  /** Filter benches by bench group identifier. */
  benchGroup?: number;
  /** Filter by whether the bench has active computing equipment assigned. */
  hasComputing?: boolean | null;
  /** Filter by whether the bench has an ongoing active booking. */
  isBooked?: boolean | null;
  /** Filter by whether the authenticated user has bookmarked this bench. */
  isFavorite?: boolean | null;
  /** Filter by whether the bench has a physical location or station mapping. */
  isMapped?: boolean | null;
  /** Filter by lifecycle status (planned, in_service, out_of_service, retired).
    
    * `planned` - Planned
    * `in_service` - In service
    * `out_of_service` - Out of service
    * `retired` - Retired */
  lifecycleStatus?: "planned" | "in_service" | "out_of_service" | "retired";
  /** Filter by physical station or room identifier. */
  location?: number;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsDashboardBenchesRetrieveByBenchIdApiResponse =
  /** status 200  */ DashboardBenchDetailDataSerializersDashboardBenchDetailDetailResponseRead;
export type LabsDashboardBenchesRetrieveByBenchIdApiArg = {
  benchId: number;
};
export type LabsDashboardSummaryRetrieveApiResponse =
  /** status 200  */ DashboardOperationalSummaryDataSerializersDashboardOperationalSummaryDetailResponse;
export type LabsDashboardSummaryRetrieveApiArg = void;
export type LabsDepartmentsRetrieveApiResponse =
  /** status 200  */ DepartmentCatalogListSerializersDepartmentPaginatedResponseRead;
export type LabsDepartmentsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsDepartmentsRetrieveByDepartmentIdApiResponse =
  /** status 200  */ DepartmentCatalogDetailSerializersDepartmentDetailResponseRead;
export type LabsDepartmentsRetrieveByDepartmentIdApiArg = {
  departmentId: number;
};
export type LabsDepartmentsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsDepartmentsOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsDeviceConnectionsRetrieveApiResponse =
  /** status 200  */ DeviceConnectionListConnectionsDeviceConnectionPaginatedResponseRead;
export type LabsDeviceConnectionsRetrieveApiArg = {
  benchId?: number;
  computingId?: number;
  isAttentionRequired?: boolean | null;
  page?: number;
  pageSize?: number;
  q?: string;
  /** * `connected` - Connected
   * `disconnected` - Disconnected */
  state?: "connected" | "disconnected";
};
export type LabsDeviceConnectionsRetrieveByConnectionIdApiResponse =
  /** status 200  */ DeviceConnectionDetailConnectionsDeviceConnectionDetailDetailResponseRead;
export type LabsDeviceConnectionsRetrieveByConnectionIdApiArg = {
  connectionId: number;
};
export type LabsDeviceConnectionsActionsLinkCreateByConnectionIdApiResponse =
  /** status 200  */ DeviceConnectionLinkActionConnectionsDeviceConnectionDetailResponseRead;
export type LabsDeviceConnectionsActionsLinkCreateByConnectionIdApiArg = {
  connectionId: number;
  linkDeviceConnectionRequest: LinkDeviceConnectionRequest;
};
export type LabsDeviceConnectionsSummaryRetrieveApiResponse =
  /** status 200  */ DeviceConnectionSummaryConnectionsDeviceConnectionSummaryDetailResponse;
export type LabsDeviceConnectionsSummaryRetrieveApiArg = {
  benchId?: number;
};
export type LabsDowntimesRetrieveApiResponse =
  /** status 200  */ DowntimeListSerializersDowntimePaginatedResponseRead;
export type LabsDowntimesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  resourceId?: number;
  /** * `room` - room
   * `station` - station
   * `bench` - bench
   * `equipment` - equipment */
  resourceType?: "room" | "station" | "bench" | "equipment";
  /** * `scheduled` - scheduled
   * `current` - current
   * `ended` - ended
   * `cancelled` - cancelled */
  state?: "scheduled" | "current" | "ended" | "cancelled";
};
export type LabsDowntimesCreateApiResponse =
  /** status 201  */ DowntimeCreateSerializersDowntimeDetailResponseRead;
export type LabsDowntimesCreateApiArg = {
  downtimeCreate: DowntimeCreate;
};
export type LabsDowntimesRetrieveByDowntimeIdApiResponse =
  /** status 200  */ DowntimeDetailSerializersDowntimeDetailResponseRead;
export type LabsDowntimesRetrieveByDowntimeIdApiArg = {
  downtimeId: number;
};
export type LabsDowntimesActionsCancelCreateByDowntimeIdApiResponse =
  /** status 200  */ DowntimeCancelSerializersDowntimeDetailResponseRead;
export type LabsDowntimesActionsCancelCreateByDowntimeIdApiArg = {
  downtimeId: number;
};
export type LabsDowntimesActionsEndCreateByDowntimeIdApiResponse =
  /** status 200  */ DowntimeEndSerializersDowntimeDetailResponseRead;
export type LabsDowntimesActionsEndCreateByDowntimeIdApiArg = {
  downtimeId: number;
};
export type LabsEquipmentRetrieveApiResponse =
  /** status 200  */ EquipmentCollectionApiViewCollectionEquipmentItemPaginatedResponseRead;
export type LabsEquipmentRetrieveApiArg = {
  assigned?: boolean;
  /** Comma-separated values; OR within this filter. */
  category?: string;
  /** Comma-separated values; OR within this filter. */
  condition?: string;
  createdAtAfter?: string;
  createdAtBefore?: string;
  customerId?: number;
  /** Comma-separated values; OR within this filter. */
  departmentId?: string;
  /** Comma-separated values; OR within this filter. */
  groupId?: string;
  /** Comma-separated values; OR within this filter. */
  id?: string;
  /** Comma-separated values; OR within this filter. */
  kind?: string;
  /** Comma-separated values; OR within this filter. */
  lifecycleState?: string;
  loanOverdue?: boolean;
  /** Comma-separated values; OR within this filter. */
  manufacturer?: string;
  materialId?: number;
  onLoan?: boolean;
  ordering?: string;
  /** Comma-separated values; OR within this filter. */
  ownerId?: string;
  page?: number;
  pageSize?: number;
  /** Comma-separated values; OR within this filter. */
  productModelId?: string;
  protocolId?: number;
  q?: string;
  resolutionId?: number;
  sizeId?: number;
  /** Comma-separated values; OR within this filter. */
  status?: string;
  technicalUserId?: number;
  /** Comma-separated values; OR within this filter. */
  type?: string;
};
export type LabsEquipmentCreateApiResponse =
  /** status 201  */ EquipmentCollectionApiViewCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentCreateApiArg = {
  equipmentCreate: EquipmentCreate;
};
export type LabsEquipmentCategoriesRetrieveApiResponse =
  /** status 200  */ EquipmentCategoriesCatalogListSerializersEquipmentCategoryPaginatedResponseRead;
export type LabsEquipmentCategoriesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsEquipmentCategoriesRetrieveByCategoryIdApiResponse =
  /** status 200  */ EquipmentCategoriesCatalogDetailSerializersEquipmentCategoryDetailResponseRead;
export type LabsEquipmentCategoriesRetrieveByCategoryIdApiArg = {
  categoryId: number;
};
export type LabsEquipmentCategoriesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsEquipmentCategoriesOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsEquipmentKindsRetrieveApiResponse =
  /** status 200  */ EquipmentKindCatalogListSerializersEquipmentKindPaginatedResponseRead;
export type LabsEquipmentKindsRetrieveApiArg = {
  categoryId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  page?: number;
  pageSize?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsEquipmentKindsRetrieveByKindIdApiResponse =
  /** status 200  */ EquipmentKindCatalogDetailSerializersEquipmentKindDetailResponseRead;
export type LabsEquipmentKindsRetrieveByKindIdApiArg = {
  kindId: number;
};
export type LabsEquipmentKindsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsEquipmentKindsOptionsRetrieveApiArg = {
  categoryId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsEquipmentLoanBatchesRetrieveByBatchIdApiResponse =
  /** status 200  */ EquipmentLoanBatchDetailSerializersEquipmentLoanBatchDetailResponseRead;
export type LabsEquipmentLoanBatchesRetrieveByBatchIdApiArg = {
  batchId: number;
};
export type LabsEquipmentLoansRetrieveApiResponse =
  /** status 200  */ EquipmentLoanListSerializersEquipmentLoanPaginatedResponseRead;
export type LabsEquipmentLoansRetrieveApiArg = {
  batchId?: number;
  borrowerId?: number;
  borrowerName?: string;
  equipmentId?: number;
  open?: boolean | null;
  overdue?: boolean | null;
  page?: number;
  pageSize?: number;
};
export type LabsEquipmentLoansCreateApiResponse =
  /** status 201  */ EquipmentLoanBatchCreatedSerializersEquipmentLoanBatchDetailResponseRead;
export type LabsEquipmentLoansCreateApiArg = {
  equipmentLendBatch: EquipmentLendBatch;
};
export type LabsEquipmentLoansActionsExtendCreateApiResponse =
  /** status 200  */ EquipmentLoansExtendedSerializersEquipmentLoanListResponseRead;
export type LabsEquipmentLoansActionsExtendCreateApiArg = {
  equipmentExtendLoans: EquipmentExtendLoans;
};
export type LabsEquipmentLoansActionsReturnCreateApiResponse =
  /** status 200  */ EquipmentLoansReturnedSerializersEquipmentLoanListResponseRead;
export type LabsEquipmentLoansActionsReturnCreateApiArg = {
  equipmentReturnBatch: EquipmentReturnBatch;
};
export type LabsEquipmentManufacturersRetrieveApiResponse =
  /** status 200  */ EquipmentManufacturerCatalogListSerializersEquipmentManufacturerPaginatedResponseRead;
export type LabsEquipmentManufacturersRetrieveApiArg = {
  categoryId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  page?: number;
  pageSize?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsEquipmentManufacturersRetrieveByManufacturerIdApiResponse =
  /** status 200  */ EquipmentManufacturerCatalogDetailSerializersEquipmentManufacturerDetailResponseRead;
export type LabsEquipmentManufacturersRetrieveByManufacturerIdApiArg = {
  manufacturerId: number;
};
export type LabsEquipmentManufacturersOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsEquipmentManufacturersOptionsRetrieveApiArg = {
  categoryId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsEquipmentProductModelsRetrieveApiResponse =
  /** status 200  */ EquipmentProductModelCatalogListSerializersEquipmentProductModelPaginatedResponseRead;
export type LabsEquipmentProductModelsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  manufacturerId?: number;
  page?: number;
  pageSize?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
  typeId?: number;
};
export type LabsEquipmentProductModelsRetrieveByModelIdApiResponse =
  /** status 200  */ EquipmentProductModelCatalogDetailSerializersEquipmentProductModelDetailResponseRead;
export type LabsEquipmentProductModelsRetrieveByModelIdApiArg = {
  modelId: number;
};
export type LabsEquipmentProductModelsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsEquipmentProductModelsOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  manufacturerId?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
  typeId?: number;
};
export type LabsEquipmentReservationsRetrieveApiResponse =
  /** status 200  */ EquipmentReservationListSerializersEquipmentReservationPaginatedResponseRead;
export type LabsEquipmentReservationsRetrieveApiArg = {
  batchId?: number;
  borrowerName?: string;
  endsAfter?: string;
  equipmentId?: number;
  page?: number;
  pageSize?: number;
  startsBefore?: string;
  /** Defaults to reserved (the calendar of what is still to come).
    
    * `reserved` - reserved
    * `in_progress` - in_progress
    * `completed` - completed
    * `cancelled` - cancelled
    * `expired` - expired */
  status?: "reserved" | "in_progress" | "completed" | "cancelled" | "expired";
};
export type LabsEquipmentReservationsCreateApiResponse =
  /** status 201  */ EquipmentReservationCreatedSerializersEquipmentLoanBatchDetailResponseRead;
export type LabsEquipmentReservationsCreateApiArg = {
  equipmentReserve: EquipmentReserve;
};
export type LabsEquipmentReservationsRetrieveByBatchIdApiResponse =
  /** status 200  */ EquipmentReservationDetailSerializersEquipmentLoanBatchDetailResponseRead;
export type LabsEquipmentReservationsRetrieveByBatchIdApiArg = {
  batchId: number;
};
export type LabsEquipmentReservationsPartialUpdateByBatchIdApiResponse =
  /** status 200  */ EquipmentReservationUpdatedSerializersEquipmentLoanBatchDetailResponseRead;
export type LabsEquipmentReservationsPartialUpdateByBatchIdApiArg = {
  batchId: number;
  patchedEquipmentReservationUpdate: PatchedEquipmentReservationUpdate;
};
export type LabsEquipmentReservationsActionsCancelCreateByBatchIdApiResponse =
  /** status 200  */ EquipmentReservationCancelledSerializersEquipmentLoanBatchDetailResponseRead;
export type LabsEquipmentReservationsActionsCancelCreateByBatchIdApiArg = {
  batchId: number;
  equipmentReservationCancel: EquipmentReservationCancel;
};
export type LabsEquipmentReservationsActionsHandOverCreateByBatchIdApiResponse =
  /** status 200  */ EquipmentReservationHandedOverSerializersEquipmentLoanBatchDetailResponseRead;
export type LabsEquipmentReservationsActionsHandOverCreateByBatchIdApiArg = {
  batchId: number;
  equipmentReservationHandOver: EquipmentReservationHandOver;
};
export type LabsEquipmentTypesRetrieveApiResponse =
  /** status 200  */ EquipmentTypeCatalogListSerializersEquipmentTypePaginatedResponseRead;
export type LabsEquipmentTypesRetrieveApiArg = {
  categoryId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  kindId?: number;
  page?: number;
  pageSize?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsEquipmentTypesRetrieveByTypeIdApiResponse =
  /** status 200  */ EquipmentTypeCatalogDetailSerializersEquipmentTypeDetailResponseRead;
export type LabsEquipmentTypesRetrieveByTypeIdApiArg = {
  typeId: number;
};
export type LabsEquipmentTypesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsEquipmentTypesOptionsRetrieveApiArg = {
  categoryId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  kindId?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsEquipmentActionsChangeConditionCreateByEquipmentIdApiResponse =
  /** status 200  */ EquipmentDetailAfterConditionChangeCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentActionsChangeConditionCreateByEquipmentIdApiArg = {
  equipmentId: number;
  equipmentChangeCondition: EquipmentChangeCondition;
};
export type LabsEquipmentActionsChangeLifecycleCreateByEquipmentIdApiResponse =
  /** status 200  */ EquipmentDetailAfterLifecycleChangeCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentActionsChangeLifecycleCreateByEquipmentIdApiArg = {
  equipmentId: number;
  equipmentChangeLifecycle: EquipmentChangeLifecycle;
};
export type LabsEquipmentActionsExtendLoanCreateByEquipmentIdApiResponse =
  /** status 200  */ EquipmentLoanExtendedSerializersEquipmentLoanDetailResponseRead;
export type LabsEquipmentActionsExtendLoanCreateByEquipmentIdApiArg = {
  equipmentId: number;
  equipmentExtendLoan: EquipmentExtendLoan;
};
export type LabsEquipmentActionsHandOverCreateByEquipmentIdApiResponse =
  /** status 200  */ EquipmentLoanOpenedSerializersEquipmentLoanDetailResponseRead;
export type LabsEquipmentActionsHandOverCreateByEquipmentIdApiArg = {
  equipmentId: number;
  equipmentHandOver: EquipmentHandOver;
};
export type LabsEquipmentActionsReturnCreateByEquipmentIdApiResponse =
  /** status 200  */ EquipmentLoanClosedSerializersEquipmentLoanDetailResponseRead;
export type LabsEquipmentActionsReturnCreateByEquipmentIdApiArg = {
  equipmentId: number;
  equipmentReturn: EquipmentReturn;
};
export type LabsEquipmentActivityRetrieveByEquipmentIdApiResponse =
  /** status 200  */ ComputingActivityDetailApiComputingActivityDetailResponseRead;
export type LabsEquipmentActivityRetrieveByEquipmentIdApiArg = {
  equipmentId: number;
};
export type LabsEquipmentAssignmentRetrieveByEquipmentIdApiResponse =
  /** status 200  */ EquipmentAssignmentDetailSerializersEquipmentAssignmentResultDetailResponseRead;
export type LabsEquipmentAssignmentRetrieveByEquipmentIdApiArg = {
  equipmentId: number;
};
export type LabsEquipmentAssignmentUpdateByEquipmentIdApiResponse =
  /** status 200  */ EquipmentAssignmentSerializersEquipmentAssignmentResultDetailResponseRead;
export type LabsEquipmentAssignmentUpdateByEquipmentIdApiArg = {
  equipmentId: number;
  equipmentAssignment: EquipmentAssignment;
};
export type LabsEquipmentAssignmentDestroyByEquipmentIdApiResponse = unknown;
export type LabsEquipmentAssignmentDestroyByEquipmentIdApiArg = {
  equipmentId: number;
};
export type LabsEquipmentHardwareIdsRetrieveByEquipmentIdApiResponse =
  /** status 200  */ EquipmentHardwareIdListHardwareIdsEquipmentHardwareIdListDetailResponseRead;
export type LabsEquipmentHardwareIdsRetrieveByEquipmentIdApiArg = {
  equipmentId: number;
};
export type LabsEquipmentHardwareIdsCreateByEquipmentIdApiResponse =
  /** status 201  */ EquipmentHardwareIdCreatedHardwareIdsEquipmentHardwareIdDetailResponseRead;
export type LabsEquipmentHardwareIdsCreateByEquipmentIdApiArg = {
  equipmentId: number;
  registerHardwareIdRequest: RegisterHardwareIdRequest;
};
export type LabsEquipmentHardwareIdsDestroyByEquipmentIdHardwareIdIdApiResponse =
  unknown;
export type LabsEquipmentHardwareIdsDestroyByEquipmentIdHardwareIdIdApiArg = {
  equipmentId: number;
  hardwareIdId: number;
};
export type LabsEquipmentImageRetrieveByEquipmentIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsEquipmentImageRetrieveByEquipmentIdApiArg = {
  equipmentId: number;
};
export type LabsEquipmentImageUpdateByEquipmentIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsEquipmentImageUpdateByEquipmentIdApiArg = {
  equipmentId: number;
  resourceImageUpload: ResourceImageUpload;
};
export type LabsEquipmentImageDestroyByEquipmentIdApiResponse = unknown;
export type LabsEquipmentImageDestroyByEquipmentIdApiArg = {
  equipmentId: number;
};
export type LabsEquipmentLoanRetrieveByEquipmentIdApiResponse =
  /** status 200  */ EquipmentLoanDetailSerializersEquipmentLoanDetailResponseRead;
export type LabsEquipmentLoanRetrieveByEquipmentIdApiArg = {
  equipmentId: number;
};
export type LabsEquipmentPlacementRetrieveByEquipmentIdApiResponse =
  /** status 200  */ EquipmentPlacementDetailSerializersEquipmentPlacementDetailResponseRead;
export type LabsEquipmentPlacementRetrieveByEquipmentIdApiArg = {
  equipmentId: number;
};
export type LabsEquipmentPlacementUpdateByEquipmentIdApiResponse =
  /** status 200  */ EquipmentPlacementUpdatedSerializersEquipmentPlacementDetailResponseRead;
export type LabsEquipmentPlacementUpdateByEquipmentIdApiArg = {
  equipmentId: number;
  equipmentPlacementWrite: EquipmentPlacementWrite;
};
export type LabsEquipmentPlacementDestroyByEquipmentIdApiResponse = unknown;
export type LabsEquipmentPlacementDestroyByEquipmentIdApiArg = {
  equipmentId: number;
};
export type LabsEquipmentStatusChangesRetrieveByEquipmentIdApiResponse =
  /** status 200  */ EquipmentStatusChangeListSerializersEquipmentStatusChangePaginatedResponseRead;
export type LabsEquipmentStatusChangesRetrieveByEquipmentIdApiArg = {
  equipmentId: number;
  page?: number;
  pageSize?: number;
};
export type LabsEquipmentRetrieveByIdApiResponse =
  /** status 200  */ EquipmentDetailApiViewResponseCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentRetrieveByIdApiArg = {
  id: number;
};
export type LabsEquipmentUpdateByIdApiResponse =
  /** status 200  */ EquipmentDetailApiViewResponseCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentUpdateByIdApiArg = {
  id: number;
  equipmentUpdate: EquipmentUpdate;
};
export type LabsEquipmentPartialUpdateByIdApiResponse =
  /** status 200  */ EquipmentDetailApiViewResponseCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentPartialUpdateByIdApiArg = {
  id: number;
  patchedEquipmentUpdate: PatchedEquipmentUpdate;
};
export type LabsEquipmentDestroyByIdApiResponse = unknown;
export type LabsEquipmentDestroyByIdApiArg = {
  id: number;
};
export type LabsEquipmentMappingRetrieveByResourceIdApiResponse =
  /** status 200  */ ResourceMappingResponse;
export type LabsEquipmentMappingRetrieveByResourceIdApiArg = {
  benchesCursor?: string;
  equipmentCursor?: string;
  licenseAssignmentsCursor?: string;
  licensesCursor?: string;
  pageSize?: number;
  resourceId: number;
  roomSlotsCursor?: string;
  roomsCursor?: string;
  stationSlotsCursor?: string;
  stationsCursor?: string;
};
export type LabsEquipmentComputingActivitySummaryRetrieveApiResponse =
  /** status 200  */ ComputingActivitySummaryDataSerializersComputingActivitySummaryDetailResponse;
export type LabsEquipmentComputingActivitySummaryRetrieveApiArg = void;
export type LabsEquipmentFacetsRetrieveApiResponse =
  /** status 200  */ EquipmentFacetsFacetsEquipmentFacetPaginatedResponseRead;
export type LabsEquipmentFacetsRetrieveApiArg = {
  assigned?: boolean;
  /** Comma-separated values; OR within this filter. */
  category?: string;
  /** Comma-separated values; OR within this filter. */
  condition?: string;
  createdAtAfter?: string;
  createdAtBefore?: string;
  customerId?: number;
  /** Comma-separated values; OR within this filter. */
  departmentId?: string;
  /** * `category` - category
   * `kind` - kind
   * `type` - type
   * `manufacturer` - manufacturer
   * `product_model_id` - product_model_id
   * `department_id` - department_id
   * `group_id` - group_id */
  dimension:
    | "category"
    | "kind"
    | "type"
    | "manufacturer"
    | "product_model_id"
    | "department_id"
    | "group_id";
  /** Comma-separated values; OR within this filter. */
  groupId?: string;
  /** Comma-separated values; OR within this filter. */
  id?: string;
  /** Comma-separated values; OR within this filter. */
  kind?: string;
  /** Comma-separated values; OR within this filter. */
  lifecycleState?: string;
  loanOverdue?: boolean;
  /** Comma-separated values; OR within this filter. */
  manufacturer?: string;
  materialId?: number;
  onLoan?: boolean;
  /** Comma-separated values; OR within this filter. */
  ownerId?: string;
  page?: number;
  pageSize?: number;
  /** Comma-separated values; OR within this filter. */
  productModelId?: string;
  protocolId?: number;
  q?: string;
  resolutionId?: number;
  sizeId?: number;
  /** Comma-separated values; OR within this filter. */
  status?: string;
  technicalUserId?: number;
  /** Comma-separated values; OR within this filter. */
  type?: string;
};
export type LabsEquipmentFiltersRetrieveApiResponse =
  /** status 200  */ EquipmentFiltersFilteringFilterMetadataDetailResponse;
export type LabsEquipmentFiltersRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsEquipmentOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsEquipmentOptionsRetrieveApiArg = {
  assignable?: boolean | null;
  assigned?: boolean | null;
  /** Parent filter. Large Equipment selectors require q or at least one declared parent filter. */
  categoryId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Parent filter. Large Equipment selectors require q or at least one declared parent filter. */
  kindId?: number;
  /** * `planned` - Planned
   * `in_service` - In service
   * `transferred_out` - Transferred out
   * `retired` - Retired
   * `lost` - Lost */
  lifecycleState?:
    "planned" | "in_service" | "transferred_out" | "retired" | "lost";
  /** Parent filter. Large Equipment selectors require q or at least one declared parent filter. */
  manufacturerId?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
  /** Filters the computed display_status.
    
    * `available` - Available
    * `in_use` - In use
    * `borrowed` - Borrowed
    * `maintenance` - Maintenance
    * `broken` - Broken
    * `calibration_overdue` - Calibration overdue
    * `on_order` - On order
    * `transferred` - Transferred
    * `retired` - Retired
    * `lost` - Lost */
  status?:
    | "available"
    | "in_use"
    | "borrowed"
    | "maintenance"
    | "broken"
    | "calibration_overdue"
    | "on_order"
    | "transferred"
    | "retired"
    | "lost";
  /** Parent filter. Large Equipment selectors require q or at least one declared parent filter. */
  typeId?: number;
};
export type LabsEquipmentReferenceDataRetrieveApiResponse =
  /** status 200  */ EquipmentReferenceDataCollectionEquipmentReferenceDataDetailResponseRead;
export type LabsEquipmentReferenceDataRetrieveApiArg = {
  /** Narrow kinds, types and makers. */
  category?: number;
};
export type LabsEquipmentReferenceDataCategoriesRetrieveApiResponse =
  /** status 200  */ EquipmentCategoryReferenceListSerializersEquipmentCategoryCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataCategoriesRetrieveApiArg = {
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataCategoriesRetrieveByReferenceIdApiResponse =
  /** status 200  */ EquipmentCategoryReferenceDetailSerializersEquipmentCategoryCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataCategoriesRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsEquipmentReferenceDataDepartmentsRetrieveApiResponse =
  /** status 200  */ DepartmentReferenceListSerializersDepartmentCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataDepartmentsRetrieveApiArg = {
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataDepartmentsCreateApiResponse =
  /** status 201  */ DepartmentReferenceCreateSerializersDepartmentCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataDepartmentsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  departmentCatalogCreate: DepartmentCatalogCreate;
};
export type LabsEquipmentReferenceDataDepartmentsRetrieveByReferenceIdApiResponse =
  /** status 200  */ DepartmentReferenceDetailSerializersDepartmentCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataDepartmentsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsEquipmentReferenceDataDisplayResolutionsRetrieveApiResponse =
  /** status 200  */ DisplayResolutionReferenceListSerializersDisplayResolutionCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataDisplayResolutionsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataDisplayResolutionsCreateApiResponse =
  /** status 201  */ DisplayResolutionReferenceCreateSerializersDisplayResolutionCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataDisplayResolutionsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  displayResolutionCatalogCreate: DisplayResolutionCatalogCreate;
};
export type LabsEquipmentReferenceDataDisplayResolutionsRetrieveByReferenceIdApiResponse =
  /** status 200  */ DisplayResolutionReferenceDetailSerializersDisplayResolutionCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataDisplayResolutionsRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataDisplaySizesRetrieveApiResponse =
  /** status 200  */ DisplaySizeReferenceListSerializersDisplaySizeCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataDisplaySizesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataDisplaySizesCreateApiResponse =
  /** status 201  */ DisplaySizeReferenceCreateSerializersDisplaySizeCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataDisplaySizesCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  displaySizeCatalogCreate: DisplaySizeCatalogCreate;
};
export type LabsEquipmentReferenceDataDisplaySizesRetrieveByReferenceIdApiResponse =
  /** status 200  */ DisplaySizeReferenceDetailSerializersDisplaySizeCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataDisplaySizesRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataGroupsRetrieveApiResponse =
  /** status 200  */ GroupReferenceListSerializersGroupCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataGroupsRetrieveApiArg = {
  departmentId?: number;
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataGroupsCreateApiResponse =
  /** status 201  */ GroupReferenceCreateSerializersGroupCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataGroupsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  groupCatalogCreate: GroupCatalogCreate;
};
export type LabsEquipmentReferenceDataGroupsRetrieveByReferenceIdApiResponse =
  /** status 200  */ GroupReferenceDetailSerializersGroupCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataGroupsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsEquipmentReferenceDataInterfacesRetrieveApiResponse =
  /** status 200  */ EquipmentInterfaceReferenceListSerializersEquipmentInterfaceCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataInterfacesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataInterfacesCreateApiResponse =
  /** status 201  */ EquipmentInterfaceReferenceCreateSerializersEquipmentInterfaceCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataInterfacesCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  equipmentInterfaceCatalogCreate: EquipmentInterfaceCatalogCreate;
};
export type LabsEquipmentReferenceDataInterfacesRetrieveByReferenceIdApiResponse =
  /** status 200  */ EquipmentInterfaceReferenceDetailSerializersEquipmentInterfaceCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataInterfacesRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsEquipmentReferenceDataKindsRetrieveApiResponse =
  /** status 200  */ EquipmentKindReferenceListSerializersEquipmentKindCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataKindsRetrieveApiArg = {
  categoryId?: number;
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataKindsCreateApiResponse =
  /** status 201  */ EquipmentKindReferenceCreateSerializersEquipmentKindCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataKindsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  equipmentKindCatalogCreate: EquipmentKindCatalogCreate;
};
export type LabsEquipmentReferenceDataKindsRetrieveByReferenceIdApiResponse =
  /** status 200  */ EquipmentKindReferenceDetailSerializersEquipmentKindCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataKindsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsEquipmentReferenceDataManufacturersRetrieveApiResponse =
  /** status 200  */ EquipmentManufacturerReferenceListSerializersEquipmentManufacturerCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataManufacturersRetrieveApiArg = {
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataManufacturersCreateApiResponse =
  /** status 201  */ EquipmentManufacturerReferenceCreateSerializersEquipmentManufacturerCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataManufacturersCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  equipmentManufacturerCatalogCreate: EquipmentManufacturerCatalogCreate;
};
export type LabsEquipmentReferenceDataManufacturersRetrieveByReferenceIdApiResponse =
  /** status 200  */ EquipmentManufacturerReferenceDetailSerializersEquipmentManufacturerCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataManufacturersRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataMaterialsRetrieveApiResponse =
  /** status 200  */ MaterialReferenceListSerializersMaterialCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataMaterialsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataMaterialsCreateApiResponse =
  /** status 201  */ MaterialReferenceCreateSerializersMaterialCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataMaterialsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  materialCatalogCreate: MaterialCatalogCreate;
};
export type LabsEquipmentReferenceDataMaterialsRetrieveByReferenceIdApiResponse =
  /** status 200  */ MaterialReferenceDetailSerializersMaterialCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataMaterialsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsEquipmentReferenceDataNetworkingProtocolsRetrieveApiResponse =
  /** status 200  */ NetworkingProtocolReferenceListSerializersNetworkingProtocolCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataNetworkingProtocolsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataNetworkingProtocolsCreateApiResponse =
  /** status 201  */ NetworkingProtocolReferenceCreateSerializersNetworkingProtocolCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataNetworkingProtocolsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  networkingProtocolCatalogCreate: NetworkingProtocolCatalogCreate;
};
export type LabsEquipmentReferenceDataNetworkingProtocolsRetrieveByReferenceIdApiResponse =
  /** status 200  */ NetworkingProtocolReferenceDetailSerializersNetworkingProtocolCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataNetworkingProtocolsRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataProductModelSpecificationsRetrieveApiResponse =
  /** status 200  */ ProductModelSpecificationReferenceListSerializersProductModelSpecificationCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataProductModelSpecificationsRetrieveApiArg =
  {
    definitionId?: number;
    page?: number;
    pageSize?: number;
    productModelId?: number;
    /** Free-text search term. */
    q?: string;
  };
export type LabsEquipmentReferenceDataProductModelSpecificationsCreateApiResponse =
  /** status 201  */ ProductModelSpecificationReferenceCreateSerializersProductModelSpecificationCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataProductModelSpecificationsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  productModelSpecificationCatalogCreate: ProductModelSpecificationCatalogCreate;
};
export type LabsEquipmentReferenceDataProductModelSpecificationsRetrieveByReferenceIdApiResponse =
  /** status 200  */ ProductModelSpecificationReferenceDetailSerializersProductModelSpecificationCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataProductModelSpecificationsRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataProductModelsRetrieveApiResponse =
  /** status 200  */ EquipmentProductModelReferenceListSerializersEquipmentProductModelCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataProductModelsRetrieveApiArg = {
  equipmentTypeId?: number;
  isActive?: boolean | null;
  manufacturerId?: number;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataProductModelsCreateApiResponse =
  /** status 201  */ EquipmentProductModelReferenceCreateSerializersEquipmentProductModelCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataProductModelsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  equipmentProductModelCatalogCreate: EquipmentProductModelCatalogCreate;
};
export type LabsEquipmentReferenceDataProductModelsRetrieveByReferenceIdApiResponse =
  /** status 200  */ EquipmentProductModelReferenceDetailSerializersEquipmentProductModelCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataProductModelsRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataSampleCharacteristicsRetrieveApiResponse =
  /** status 200  */ SampleCharacteristicReferenceListSerializersSampleCharacteristicCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataSampleCharacteristicsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataSampleCharacteristicsCreateApiResponse =
  /** status 201  */ SampleCharacteristicReferenceCreateSerializersSampleCharacteristicCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataSampleCharacteristicsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  sampleCharacteristicCatalogCreate: SampleCharacteristicCatalogCreate;
};
export type LabsEquipmentReferenceDataSampleCharacteristicsRetrieveByReferenceIdApiResponse =
  /** status 200  */ SampleCharacteristicReferenceDetailSerializersSampleCharacteristicCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataSampleCharacteristicsRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataSampleCustomersRetrieveApiResponse =
  /** status 200  */ SampleCustomerReferenceListSerializersSampleCustomerCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataSampleCustomersRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataSampleCustomersCreateApiResponse =
  /** status 201  */ SampleCustomerReferenceCreateSerializersSampleCustomerCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataSampleCustomersCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  sampleCustomerCatalogCreate: SampleCustomerCatalogCreate;
};
export type LabsEquipmentReferenceDataSampleCustomersRetrieveByReferenceIdApiResponse =
  /** status 200  */ SampleCustomerReferenceDetailSerializersSampleCustomerCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataSampleCustomersRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataSpecificationDefinitionsRetrieveApiResponse =
  /** status 200  */ SpecificationDefinitionReferenceListSerializersSpecificationDefinitionCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataSpecificationDefinitionsRetrieveApiArg = {
  categoryId?: number;
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataSpecificationDefinitionsCreateApiResponse =
  /** status 201  */ SpecificationDefinitionReferenceCreateSerializersSpecificationDefinitionCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataSpecificationDefinitionsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  specificationDefinitionCatalogCreate: SpecificationDefinitionCatalogCreate;
};
export type LabsEquipmentReferenceDataSpecificationDefinitionsRetrieveByReferenceIdApiResponse =
  /** status 200  */ SpecificationDefinitionReferenceDetailSerializersSpecificationDefinitionCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataSpecificationDefinitionsRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataTechnicalUsersRetrieveApiResponse =
  /** status 200  */ TechnicalUserReferenceListSerializersTechnicalUserCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataTechnicalUsersRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataTechnicalUsersCreateApiResponse =
  /** status 201  */ TechnicalUserReferenceCreateSerializersTechnicalUserCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataTechnicalUsersCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  technicalUserCatalogCreate: TechnicalUserCatalogCreate;
};
export type LabsEquipmentReferenceDataTechnicalUsersRetrieveByReferenceIdApiResponse =
  /** status 200  */ TechnicalUserReferenceDetailSerializersTechnicalUserCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataTechnicalUsersRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsEquipmentReferenceDataTypesRetrieveApiResponse =
  /** status 200  */ EquipmentTypeReferenceListSerializersEquipmentTypeCatalogRecordPaginatedResponseRead;
export type LabsEquipmentReferenceDataTypesRetrieveApiArg = {
  isActive?: boolean | null;
  kindId?: number;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsEquipmentReferenceDataTypesCreateApiResponse =
  /** status 201  */ EquipmentTypeReferenceCreateSerializersEquipmentTypeCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataTypesCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  equipmentTypeCatalogCreate: EquipmentTypeCatalogCreate;
};
export type LabsEquipmentReferenceDataTypesRetrieveByReferenceIdApiResponse =
  /** status 200  */ EquipmentTypeReferenceDetailSerializersEquipmentTypeCatalogRecordDetailResponseRead;
export type LabsEquipmentReferenceDataTypesRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsEquipmentSkuRetrieveBySkuApiResponse =
  /** status 200  */ EquipmentBySkuCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentSkuRetrieveBySkuApiArg = {
  sku: string;
};
export type LabsEquipmentSkuPartialUpdateBySkuApiResponse =
  /** status 200  */ EquipmentBySkuCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentSkuPartialUpdateBySkuApiArg = {
  sku: string;
  patchedEquipmentUpdate: PatchedEquipmentUpdate;
};
export type LabsEquipmentStatusSummaryRetrieveApiResponse =
  /** status 200  */ EquipmentStatusSummaryDataSerializersEquipmentStatusSummaryDetailResponse;
export type LabsEquipmentStatusSummaryRetrieveApiArg = {
  /** Count one category only. */
  category?: number;
};
export type LabsEquipmentUidRetrieveByUidApiResponse =
  /** status 200  */ EquipmentByUidCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentUidRetrieveByUidApiArg = {
  uid: string;
};
export type LabsEquipmentUidPartialUpdateByUidApiResponse =
  /** status 200  */ EquipmentByUidCollectionEquipmentDetailDetailResponseRead;
export type LabsEquipmentUidPartialUpdateByUidApiArg = {
  uid: string;
  patchedEquipmentUpdate: PatchedEquipmentUpdate;
};
export type LabsExpectedDevicesRetrieveApiResponse =
  /** status 200  */ ExpectedDeviceListConnectionsExpectedDevicePaginatedResponseRead;
export type LabsExpectedDevicesRetrieveApiArg = {
  benchId?: number;
  computingId?: number;
  page?: number;
  pageSize?: number;
  /** * `present` - Present
   * `missing` - Missing
   * `unconfirmed` - Unconfirmed */
  presence?: "present" | "missing" | "unconfirmed";
};
export type LabsExpectedDevicesCreateApiResponse =
  /** status 201  */ ExpectedDeviceCreateConnectionsExpectedDeviceDetailResponseRead;
export type LabsExpectedDevicesCreateApiArg = {
  createExpectedDeviceRequest: CreateExpectedDeviceRequest;
};
export type LabsExpectedDevicesPartialUpdateByExpectedDeviceIdApiResponse =
  /** status 200  */ ExpectedDeviceUpdateConnectionsExpectedDeviceDetailResponseRead;
export type LabsExpectedDevicesPartialUpdateByExpectedDeviceIdApiArg = {
  expectedDeviceId: number;
  patchedUpdateExpectedDeviceRequest: PatchedUpdateExpectedDeviceRequest;
};
export type LabsExpectedDevicesDestroyByExpectedDeviceIdApiResponse = unknown;
export type LabsExpectedDevicesDestroyByExpectedDeviceIdApiArg = {
  expectedDeviceId: number;
};
export type LabsExpectedDevicesLegacySuggestionsRetrieveApiResponse =
  /** status 200  */ LegacyDeviceSuggestionListConnectionsLegacyDeviceSuggestionListDetailResponseRead;
export type LabsExpectedDevicesLegacySuggestionsRetrieveApiArg = {
  computingId: number;
};
export type LabsExpensesPaymentsRetrieveByExpenseIdApiResponse =
  /** status 200  */ ExpensePaymentListSerializersExpensePaymentPaginatedResponseRead;
export type LabsExpensesPaymentsRetrieveByExpenseIdApiArg = {
  expenseId: number;
  page?: number;
  pageSize?: number;
};
export type LabsExpensesPaymentsCreateByExpenseIdApiResponse =
  /** status 201  */ ExpensePaymentSerializersExpensePaymentDetailResponseRead;
export type LabsExpensesPaymentsCreateByExpenseIdApiArg = {
  expenseId: number;
  expensePaymentWrite: ExpensePaymentWrite;
};
export type LabsExpensesReportRetrieveApiResponse =
  /** status 200  */ FinancialReportSerializersFinancialReportResponseDetailResponseRead;
export type LabsExpensesReportRetrieveApiArg = {
  billingPeriod?: string;
  currency?: string;
  expenseType?: string;
  fromDate?: string;
  roomId?: number;
  status?: string;
  toDate?: string;
};
export type LabsGroupsRetrieveApiResponse =
  /** status 200  */ GroupCatalogListSerializersGroupCatalogPaginatedResponseRead;
export type LabsGroupsRetrieveApiArg = {
  departmentId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  page?: number;
  pageSize?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsGroupsRetrieveByGroupIdApiResponse =
  /** status 200  */ GroupCatalogDetailSerializersGroupCatalogDetailResponseRead;
export type LabsGroupsRetrieveByGroupIdApiArg = {
  groupId: number;
};
export type LabsGroupsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsGroupsOptionsRetrieveApiArg = {
  departmentId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsLabDashboardRetrieveApiResponse =
  /** status 200  */ LabDashboardResponse;
export type LabsLabDashboardRetrieveApiArg = void;
export type LabsLabProjectsRetrieveApiResponse =
  /** status 200  */ LabProjectListSerializersLabProjectPaginatedResponseRead;
export type LabsLabProjectsRetrieveApiArg = {
  isActive?: boolean | null;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsLabProjectsRetrieveByProjectIdApiResponse =
  /** status 200  */ LabProjectDetailSerializersLabProjectDetailResponseRead;
export type LabsLabProjectsRetrieveByProjectIdApiArg = {
  projectId: number;
};
export type LabsLabProjectsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsLabProjectsOptionsRetrieveApiArg = {
  /** Date within project start_date and end_date. */
  activeOn?: string;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsLabSessionsRetrieveApiResponse =
  /** status 200  */ SessionLogListSerializersSessionLogItemPaginatedResponseRead;
export type LabsLabSessionsRetrieveApiArg = {
  /** * `booked` - Booked
   * `ad_hoc` - Ad hoc (no booking)
   * `unverified_booking` - Booking not verified */
  accessType?: "booked" | "ad_hoc" | "unverified_booking";
  benchId?: number;
  computerId?: number;
  /** Last login day, inclusive (server time zone). */
  endDate: string;
  /** Default -login_time (newest first). The row id always breaks ties.
    
    * `-active_duration_seconds` - -active_duration_seconds
    * `-login_time` - -login_time
    * `-logout_time` - -logout_time
    * `active_duration_seconds` - active_duration_seconds
    * `login_time` - login_time
    * `logout_time` - logout_time */
  ordering?:
    | "-active_duration_seconds"
    | "-login_time"
    | "-logout_time"
    | "active_duration_seconds"
    | "login_time"
    | "logout_time";
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
  /** First login day, inclusive (server time zone). */
  startDate: string;
  userId?: number;
};
export type LabsLeaderboardExportRetrieveApiResponse =
  /** status 200  */ LeaderboardExportSerializersLeaderboardPersonaListResponse;
export type LabsLeaderboardExportRetrieveApiArg = {
  endDate?: string;
  startDate?: string;
  /** * `persona` - persona
   * `lab` - lab */
  type?: "persona" | "lab";
};
export type LabsLeaderboardLabRetrieveApiResponse =
  /** status 200  */ LeaderboardLabSerializersLeaderboardLabListResponse;
export type LabsLeaderboardLabRetrieveApiArg = {
  endDate?: string;
  startDate?: string;
};
export type LabsLeaderboardPersonaRetrieveApiResponse =
  /** status 200  */ LeaderboardPersonaSerializersLeaderboardPersonaListResponse;
export type LabsLeaderboardPersonaRetrieveApiArg = {
  endDate?: string;
  startDate?: string;
};
export type LabsLeaderboardUsersProfileRetrieveByIdApiResponse =
  /** status 200  */ UserProfileSerializersUserProfileDetailResponse;
export type LabsLeaderboardUsersProfileRetrieveByIdApiArg = {
  endDate?: string;
  id: number;
  startDate?: string;
};
export type LabsLeaderboardUsersWeeklyUsageRetrieveByIdApiResponse =
  /** status 200  */ UserWeeklyUsageSerializersWeeklyUsageSlotListResponse;
export type LabsLeaderboardUsersWeeklyUsageRetrieveByIdApiArg = {
  id: number;
};
export type LabsLicenseCategoriesRetrieveApiResponse =
  /** status 200  */ LicenseCategoryCatalogListSerializersLicenseCategoryPaginatedResponseRead;
export type LabsLicenseCategoriesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsLicenseCategoriesRetrieveByCategoryIdApiResponse =
  /** status 200  */ LicenseCategoryCatalogDetailSerializersLicenseCategoryDetailResponseRead;
export type LabsLicenseCategoriesRetrieveByCategoryIdApiArg = {
  categoryId: number;
};
export type LabsLicenseCategoriesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsLicenseCategoriesOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsLicenseProductsRetrieveApiResponse =
  /** status 200  */ LicenseProductCatalogListSerializersLicenseProductPaginatedResponseRead;
export type LabsLicenseProductsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  page?: number;
  pageSize?: number;
  /** Search text (1 to 100 characters). */
  q?: string;
  vendorId?: number;
};
export type LabsLicenseProductsRetrieveByProductIdApiResponse =
  /** status 200  */ LicenseProductCatalogDetailSerializersLicenseProductDetailResponseRead;
export type LabsLicenseProductsRetrieveByProductIdApiArg = {
  productId: number;
};
export type LabsLicenseProductsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsLicenseProductsOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
  vendorId?: number;
};
export type LabsLicenseRestrictionsRetrieveApiResponse =
  /** status 200  */ LicenseRestrictionCatalogListSerializersLicenseRestrictionPaginatedResponseRead;
export type LabsLicenseRestrictionsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsLicenseRestrictionsRetrieveByRestrictionIdApiResponse =
  /** status 200  */ LicenseRestrictionCatalogDetailSerializersLicenseRestrictionDetailResponseRead;
export type LabsLicenseRestrictionsRetrieveByRestrictionIdApiArg = {
  restrictionId: number;
};
export type LabsLicenseRestrictionsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsLicenseRestrictionsOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsLicenseTypesRetrieveApiResponse =
  /** status 200  */ LicenseTypeCatalogListSerializersLicenseTypePaginatedResponseRead;
export type LabsLicenseTypesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsLicenseTypesRetrieveByTypeIdApiResponse =
  /** status 200  */ LicenseTypeCatalogDetailSerializersLicenseTypeDetailResponseRead;
export type LabsLicenseTypesRetrieveByTypeIdApiArg = {
  typeId: number;
};
export type LabsLicenseTypesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsLicenseTypesOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsLicenseVendorsRetrieveApiResponse =
  /** status 200  */ LicenseVendorCatalogListSerializersLicenseVendorPaginatedResponseRead;
export type LabsLicenseVendorsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsLicenseVendorsRetrieveByVendorIdApiResponse =
  /** status 200  */ LicenseVendorCatalogDetailSerializersLicenseVendorDetailResponseRead;
export type LabsLicenseVendorsRetrieveByVendorIdApiArg = {
  vendorId: number;
};
export type LabsLicenseVendorsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsLicenseVendorsOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsLicensesRetrieveApiResponse =
  /** status 200  */ LicenseListSerializersLicensePaginatedResponseRead;
export type LabsLicensesRetrieveApiArg = {
  createdAtAfter?: string;
  createdAtBefore?: string;
  /** Comma-separated values; OR within this filter. */
  groupId?: string;
  /** Comma-separated values; OR within this filter. */
  id?: string;
  ordering?: string;
  /** Comma-separated values; OR within this filter. */
  ownerId?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  /** Comma-separated values; OR within this filter. */
  status?: string;
};
export type LabsLicensesCreateApiResponse =
  /** status 201  */ LicenseCreateSerializersLicenseDetailResponseRead;
export type LabsLicensesCreateApiArg = {
  licenseCreate: LicenseCreateWrite;
};
export type LabsLicensesRetrieveByLicenseIdApiResponse =
  /** status 200  */ LicenseDetailSerializersLicenseDetailResponseRead;
export type LabsLicensesRetrieveByLicenseIdApiArg = {
  licenseId: number;
};
export type LabsLicensesPartialUpdateByLicenseIdApiResponse =
  /** status 200  */ LicenseUpdateSerializersLicenseDetailResponseRead;
export type LabsLicensesPartialUpdateByLicenseIdApiArg = {
  licenseId: number;
  patchedLicenseUpdate: PatchedLicenseUpdateWrite;
};
export type LabsLicensesDestroyByLicenseIdApiResponse = unknown;
export type LabsLicensesDestroyByLicenseIdApiArg = {
  licenseId: number;
};
export type LabsLicensesActionsAssignCreateByLicenseIdApiResponse =
  /** status 200  */ LicenseAssignActionSerializersLicenseAssignmentResultDetailResponseRead;
export type LabsLicensesActionsAssignCreateByLicenseIdApiArg = {
  licenseId: number;
  licenseAssignmentRequest: LicenseAssignmentRequest;
};
export type LabsLicensesActionsAssignDestroyByLicenseIdApiResponse = unknown;
export type LabsLicensesActionsAssignDestroyByLicenseIdApiArg = {
  licenseId: number;
};
export type LabsLicensesActionsChangeStatusCreateByLicenseIdApiResponse =
  /** status 200  */ LicenseDetailSerializersLicenseDetailResponseRead;
export type LabsLicensesActionsChangeStatusCreateByLicenseIdApiArg = {
  licenseId: number;
  licenseStatus: LicenseStatus;
};
export type LabsLicensesAgreementsRetrieveByLicenseIdApiResponse =
  /** status 200  */ LicenseAgreementListSerializersLicenseAgreementPaginatedResponseRead;
export type LabsLicensesAgreementsRetrieveByLicenseIdApiArg = {
  licenseId: number;
  page?: number;
  pageSize?: number;
};
export type LabsLicensesAgreementsCreateByLicenseIdApiResponse =
  /** status 201  */ LicenseAgreementSerializersLicenseAgreementDetailResponseRead;
export type LabsLicensesAgreementsCreateByLicenseIdApiArg = {
  licenseId: number;
  licenseAgreementWrite: LicenseAgreementWrite;
};
export type LabsLicensesHistoryRetrieveByLicenseIdApiResponse =
  /** status 200  */ LicenseHistorySerializersLicenseStatusRecordPaginatedResponseRead;
export type LabsLicensesHistoryRetrieveByLicenseIdApiArg = {
  licenseId: number;
  page?: number;
  pageSize?: number;
};
export type LabsLicensesImageRetrieveByLicenseIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsLicensesImageRetrieveByLicenseIdApiArg = {
  licenseId: number;
};
export type LabsLicensesImageUpdateByLicenseIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsLicensesImageUpdateByLicenseIdApiArg = {
  licenseId: number;
  resourceImageUpload: ResourceImageUpload;
};
export type LabsLicensesImageDestroyByLicenseIdApiResponse = unknown;
export type LabsLicensesImageDestroyByLicenseIdApiArg = {
  licenseId: number;
};
export type LabsLicensesCategoriesSummaryRetrieveApiResponse =
  /** status 200  */ LicenseCategorySummaryListSerializersLicenseCategorySummaryPaginatedResponse;
export type LabsLicensesCategoriesSummaryRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsLicensesFiltersRetrieveApiResponse =
  /** status 200  */ LicenseFiltersFilteringFilterMetadataDetailResponse;
export type LabsLicensesFiltersRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsLicensesReferenceDataCategoriesRetrieveApiResponse =
  /** status 200  */ LicenseCategoryReferenceListSerializersLicenseCategoryCatalogRecordPaginatedResponseRead;
export type LabsLicensesReferenceDataCategoriesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsLicensesReferenceDataCategoriesCreateApiResponse =
  /** status 201  */ LicenseCategoryReferenceCreateSerializersLicenseCategoryCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataCategoriesCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  licenseCategoryCatalogCreate: LicenseCategoryCatalogCreate;
};
export type LabsLicensesReferenceDataCategoriesRetrieveByReferenceIdApiResponse =
  /** status 200  */ LicenseCategoryReferenceDetailSerializersLicenseCategoryCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataCategoriesRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsLicensesReferenceDataProductsRetrieveApiResponse =
  /** status 200  */ LicenseProductReferenceListSerializersLicenseProductCatalogRecordPaginatedResponseRead;
export type LabsLicensesReferenceDataProductsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
  vendorId?: number;
};
export type LabsLicensesReferenceDataProductsCreateApiResponse =
  /** status 201  */ LicenseProductReferenceCreateSerializersLicenseProductCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataProductsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  licenseProductCatalogCreate: LicenseProductCatalogCreate;
};
export type LabsLicensesReferenceDataProductsRetrieveByReferenceIdApiResponse =
  /** status 200  */ LicenseProductReferenceDetailSerializersLicenseProductCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataProductsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsLicensesReferenceDataRestrictionsRetrieveApiResponse =
  /** status 200  */ LicenseRestrictionReferenceListSerializersLicenseRestrictionCatalogRecordPaginatedResponseRead;
export type LabsLicensesReferenceDataRestrictionsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsLicensesReferenceDataRestrictionsCreateApiResponse =
  /** status 201  */ LicenseRestrictionReferenceCreateSerializersLicenseRestrictionCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataRestrictionsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  licenseRestrictionCatalogCreate: LicenseRestrictionCatalogCreate;
};
export type LabsLicensesReferenceDataRestrictionsRetrieveByReferenceIdApiResponse =
  /** status 200  */ LicenseRestrictionReferenceDetailSerializersLicenseRestrictionCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataRestrictionsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsLicensesReferenceDataTypesRetrieveApiResponse =
  /** status 200  */ LicenseTypeReferenceListSerializersLicenseTypeCatalogRecordPaginatedResponseRead;
export type LabsLicensesReferenceDataTypesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsLicensesReferenceDataTypesCreateApiResponse =
  /** status 201  */ LicenseTypeReferenceCreateSerializersLicenseTypeCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataTypesCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  licenseTypeCatalogCreate: LicenseTypeCatalogCreate;
};
export type LabsLicensesReferenceDataTypesRetrieveByReferenceIdApiResponse =
  /** status 200  */ LicenseTypeReferenceDetailSerializersLicenseTypeCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataTypesRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsLicensesReferenceDataVendorsRetrieveApiResponse =
  /** status 200  */ LicenseVendorReferenceListSerializersLicenseVendorCatalogRecordPaginatedResponseRead;
export type LabsLicensesReferenceDataVendorsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsLicensesReferenceDataVendorsCreateApiResponse =
  /** status 201  */ LicenseVendorReferenceCreateSerializersLicenseVendorCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataVendorsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  licenseVendorCatalogCreate: LicenseVendorCatalogCreate;
};
export type LabsLicensesReferenceDataVendorsRetrieveByReferenceIdApiResponse =
  /** status 200  */ LicenseVendorReferenceDetailSerializersLicenseVendorCatalogRecordDetailResponseRead;
export type LabsLicensesReferenceDataVendorsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsLicensesStatusSummaryRetrieveApiResponse =
  /** status 200  */ LicenseStatusSummaryDataSerializersLicenseStatusSummaryDetailResponse;
export type LabsLicensesStatusSummaryRetrieveApiArg = void;
export type LabsLocationsReferenceDataBuildingsRetrieveApiResponse =
  /** status 200  */ BuildingReferenceListSerializersBuildingCatalogRecordPaginatedResponseRead;
export type LabsLocationsReferenceDataBuildingsRetrieveApiArg = {
  cityId?: number;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsLocationsReferenceDataBuildingsCreateApiResponse =
  /** status 201  */ BuildingReferenceCreateSerializersBuildingCatalogRecordDetailResponseRead;
export type LabsLocationsReferenceDataBuildingsCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  buildingCatalogCreate: BuildingCatalogCreate;
};
export type LabsLocationsReferenceDataBuildingsRetrieveByReferenceIdApiResponse =
  /** status 200  */ BuildingReferenceDetailSerializersBuildingCatalogRecordDetailResponseRead;
export type LabsLocationsReferenceDataBuildingsRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsLocationsReferenceDataCitiesRetrieveApiResponse =
  /** status 200  */ CityReferenceListSerializersCityCatalogRecordPaginatedResponseRead;
export type LabsLocationsReferenceDataCitiesRetrieveApiArg = {
  countryId?: number;
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsLocationsReferenceDataCitiesCreateApiResponse =
  /** status 201  */ CityReferenceCreateSerializersCityCatalogRecordDetailResponseRead;
export type LabsLocationsReferenceDataCitiesCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  cityCatalogCreate: CityCatalogCreate;
};
export type LabsLocationsReferenceDataCitiesRetrieveByReferenceIdApiResponse =
  /** status 200  */ CityReferenceDetailSerializersCityCatalogRecordDetailResponseRead;
export type LabsLocationsReferenceDataCitiesRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsLocationsReferenceDataCountriesRetrieveApiResponse =
  /** status 200  */ CountryReferenceListSerializersCountryCatalogRecordPaginatedResponseRead;
export type LabsLocationsReferenceDataCountriesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsLocationsReferenceDataCountriesCreateApiResponse =
  /** status 201  */ CountryReferenceCreateSerializersCountryCatalogRecordDetailResponseRead;
export type LabsLocationsReferenceDataCountriesCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  countryCatalogCreate: CountryCatalogCreate;
};
export type LabsLocationsReferenceDataCountriesRetrieveByReferenceIdApiResponse =
  /** status 200  */ CountryReferenceDetailSerializersCountryCatalogRecordDetailResponseRead;
export type LabsLocationsReferenceDataCountriesRetrieveByReferenceIdApiArg = {
  referenceId: number;
};
export type LabsLocationsReferenceDataStationTypesRetrieveApiResponse =
  /** status 200  */ StationTypeReferenceListSerializersStationTypeCatalogRecordPaginatedResponseRead;
export type LabsLocationsReferenceDataStationTypesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  /** Free-text search term. */
  q?: string;
};
export type LabsLocationsReferenceDataStationTypesCreateApiResponse =
  /** status 201  */ StationTypeReferenceCreateSerializersStationTypeCatalogRecordDetailResponseRead;
export type LabsLocationsReferenceDataStationTypesCreateApiArg = {
  /** Required replay key (max 128 characters); receipts retained until explicitly purged. */
  "Idempotency-Key": string;
  stationTypeCatalogCreate: StationTypeCatalogCreate;
};
export type LabsLocationsReferenceDataStationTypesRetrieveByReferenceIdApiResponse =
  /** status 200  */ StationTypeReferenceDetailSerializersStationTypeCatalogRecordDetailResponseRead;
export type LabsLocationsReferenceDataStationTypesRetrieveByReferenceIdApiArg =
  {
    referenceId: number;
  };
export type LabsMonitoringEventsRetrieveApiResponse =
  /** status 200  */ MonitoringEventListSerializersMonitoringEventPaginatedResponseRead;
export type LabsMonitoringEventsRetrieveApiArg = {
  action?: string;
  benchId?: number;
  computerId?: number;
  computerSku?: string;
  computingId?: number;
  fromDate?: string;
  fromDateTime?: string;
  lab?: number;
  page?: number;
  pageSize?: number;
  subjectType?: string;
  toDate?: string;
  toDateTime?: string;
};
export type LabsMonitoringEventsCreateApiResponse =
  /** status 201  */ MonitoringEventSerializersMonitoringEventDetailResponseRead;
export type LabsMonitoringEventsCreateApiArg = {
  monitoringEventCreate: MonitoringEventCreate;
};
export type LabsMonitoringEventsRetrieveByIdApiResponse =
  /** status 200  */ MonitoringEventDetailSerializersMonitoringEventDetailResponseRead;
export type LabsMonitoringEventsRetrieveByIdApiArg = {
  id: number;
};
export type LabsMonitoringEventsExportRetrieveApiResponse =
  /** status 200  */ MonitoringEventExportSerializersMonitoringEventListResponseRead;
export type LabsMonitoringEventsExportRetrieveApiArg = {
  action?: string;
  benchId?: number;
  computerId?: number;
  computerSku?: string;
  computingId?: number;
  fromDate?: string;
  fromDateTime?: string;
  lab?: number;
  subjectType?: string;
  toDate?: string;
  toDateTime?: string;
};
export type LabsPurchaseItemsResourcesRetrieveByPurchaseItemIdApiResponse =
  /** status 200  */ PurchaseItemResourceListSerializersPurchaseItemResourcePaginatedResponseRead;
export type LabsPurchaseItemsResourcesRetrieveByPurchaseItemIdApiArg = {
  page?: number;
  pageSize?: number;
  purchaseItemId: number;
};
export type LabsPurchaseItemsResourcesCreateByPurchaseItemIdApiResponse =
  /** status 201  */ PurchaseItemResourceSerializersPurchaseItemResourceDetailResponseRead;
export type LabsPurchaseItemsResourcesCreateByPurchaseItemIdApiArg = {
  purchaseItemId: number;
  purchaseItemResourceCreate: PurchaseItemResourceCreateWrite;
};
export type LabsPurchasePrioritiesRetrieveApiResponse =
  /** status 200  */ PurchasePriorityOptionsSerializersPurchasePriorityOptionListResponseRead;
export type LabsPurchasePrioritiesRetrieveApiArg = {
  /** * `true` - true
   * `false` - false */
  includeInactive?: "true" | "false";
};
export type LabsPurchasesRetrieveApiResponse =
  /** status 200  */ PurchaseListSerializersPurchasePaginatedResponseRead;
export type LabsPurchasesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsPurchasesCreateApiResponse =
  /** status 201  */ PurchaseSerializersPurchaseDetailResponseRead;
export type LabsPurchasesCreateApiArg = {
  purchase: PurchaseWrite;
};
export type LabsPurchasesRetrieveByPurchaseIdApiResponse =
  /** status 200  */ PurchaseDetailSerializersPurchaseDetailDetailResponseRead;
export type LabsPurchasesRetrieveByPurchaseIdApiArg = {
  purchaseId: number;
};
export type LabsPurchasesDraftPartialUpdateByPurchaseIdApiResponse =
  /** status 200  */ PurchaseDraftHeaderSerializersPurchaseDraftHeaderOutputDetailResponseRead;
export type LabsPurchasesDraftPartialUpdateByPurchaseIdApiArg = {
  purchaseId: number;
  patchedPurchaseDraftHeaderInput: PatchedPurchaseDraftHeaderInput;
};
export type LabsPurchasesItemsRetrieveByPurchaseIdApiResponse =
  /** status 200  */ PurchaseItemListSerializersPurchaseItemReadPaginatedResponseRead;
export type LabsPurchasesItemsRetrieveByPurchaseIdApiArg = {
  page?: number;
  pageSize?: number;
  purchaseId: number;
};
export type LabsPurchasesItemsCreateByPurchaseIdApiResponse =
  /** status 201  */ PurchaseItemSerializersPurchaseItemReadDetailResponseRead;
export type LabsPurchasesItemsCreateByPurchaseIdApiArg = {
  purchaseId: number;
  purchaseItem: PurchaseItemWrite;
};
export type LabsPurchasesItemsRetrieveByPurchaseIdItemIdApiResponse =
  /** status 200  */ PurchaseDraftLineSerializersPurchaseItemDetailDetailResponseRead;
export type LabsPurchasesItemsRetrieveByPurchaseIdItemIdApiArg = {
  itemId: number;
  purchaseId: number;
};
export type LabsPurchasesItemsPartialUpdateByPurchaseIdItemIdApiResponse =
  /** status 200  */ PurchaseDraftLineSerializersPurchaseItemDetailDetailResponseRead;
export type LabsPurchasesItemsPartialUpdateByPurchaseIdItemIdApiArg = {
  itemId: number;
  purchaseId: number;
  patchedDraftLinePatchInput: PatchedDraftLinePatchInput;
};
export type LabsPurchasesItemsDestroyByPurchaseIdItemIdApiResponse =
  /** status 204  */ PurchaseDraftLineDeletedEmptyResponseRead;
export type LabsPurchasesItemsDestroyByPurchaseIdItemIdApiArg = {
  itemId: number;
  purchaseId: number;
};
export type LabsPurchasesItemsDraftRetrieveByPurchaseIdApiResponse =
  /** status 200  */ PurchaseDraftLineListSerializersPurchaseItemDetailListResponseRead;
export type LabsPurchasesItemsDraftRetrieveByPurchaseIdApiArg = {
  purchaseId: number;
};
export type LabsPurchasesItemsDraftCreateByPurchaseIdApiResponse =
  /** status 201  */ PurchaseDraftLineSerializersPurchaseItemDetailDetailResponseRead;
export type LabsPurchasesItemsDraftCreateByPurchaseIdApiArg = {
  purchaseId: number;
  draftLineInput: DraftLineInput;
};
export type LabsPurchasesTransactionsRetrieveByPurchaseIdApiResponse =
  /** status 200  */ PurchaseTransactionListSerializersPurchaseTransactionPaginatedResponseRead;
export type LabsPurchasesTransactionsRetrieveByPurchaseIdApiArg = {
  page?: number;
  pageSize?: number;
  purchaseId: number;
};
export type LabsPurchasesTransactionsCreateByPurchaseIdApiResponse =
  /** status 201  */ PurchaseTransactionSerializersPurchaseTransactionDetailResponseRead;
export type LabsPurchasesTransactionsCreateByPurchaseIdApiArg = {
  purchaseId: number;
  purchaseTransactionWrite: PurchaseTransactionWrite;
};
export type LabsResourceMappingsRetrieveApiResponse =
  /** status 200  */ BenchMappingListResponse;
export type LabsResourceMappingsRetrieveApiArg = {
  benchId?: number;
  /** Benches with at least one unit of this equipment category. */
  equipmentCategoryId?: number;
  page?: number;
  pageSize?: number;
  /** Matches the SKU or name of the bench, its station, its room or a unit placed on it. */
  q?: string;
  roomId?: number;
  /** needs_placement: no station in a room. needs_equipment: placed, no units. fully_mapped: both.
    
    * `fully_mapped` - Fully mapped
    * `needs_equipment` - Needs equipment
    * `needs_placement` - Needs placement */
  state?: "fully_mapped" | "needs_equipment" | "needs_placement";
  stationId?: number;
};
export type LabsResourcesAuditsRetrieveByResourceTypeResourceIdApiResponse =
  /** status 200  */ TypedResourceAuditListSerializersResourceAuditItemPaginatedResponseRead;
export type LabsResourcesAuditsRetrieveByResourceTypeResourceIdApiArg = {
  page?: number;
  pageSize?: number;
  resourceId: string;
  resourceType: string;
};
export type LabsResourcesAuditsCreateByResourceTypeResourceIdApiResponse =
  /** status 201  */ TypedResourceAuditItemSerializersResourceAuditItemDetailResponseRead;
export type LabsResourcesAuditsCreateByResourceTypeResourceIdApiArg = {
  resourceId: string;
  resourceType: string;
  recordResourceAuditRequest: RecordResourceAuditRequest;
};
export type LabsResourcesIdAuditsRetrieveByResourceIdApiResponse =
  /** status 200  */ ResourceAuditListByIdSerializersResourceAuditItemPaginatedResponseRead;
export type LabsResourcesIdAuditsRetrieveByResourceIdApiArg = {
  page?: number;
  pageSize?: number;
  resourceId: number;
};
export type LabsResourcesIdAuditsCreateByResourceIdApiResponse =
  /** status 201  */ ResourceAuditItemByIdSerializersResourceAuditItemDetailResponseRead;
export type LabsResourcesIdAuditsCreateByResourceIdApiArg = {
  resourceId: number;
  recordResourceAuditRequest: RecordResourceAuditRequest;
};
export type LabsResourcesSkuAuditsRetrieveBySkuApiResponse =
  /** status 200  */ ResourceAuditListBySkuSerializersResourceAuditItemPaginatedResponseRead;
export type LabsResourcesSkuAuditsRetrieveBySkuApiArg = {
  page?: number;
  pageSize?: number;
  sku: string;
};
export type LabsResourcesSkuAuditsCreateBySkuApiResponse =
  /** status 201  */ ResourceAuditItemBySkuSerializersResourceAuditItemDetailResponseRead;
export type LabsResourcesSkuAuditsCreateBySkuApiArg = {
  sku: string;
  recordResourceAuditRequest: RecordResourceAuditRequest;
};
export type LabsResourcesUidAuditsRetrieveByUidApiResponse =
  /** status 200  */ ResourceAuditListByUidSerializersResourceAuditItemPaginatedResponseRead;
export type LabsResourcesUidAuditsRetrieveByUidApiArg = {
  page?: number;
  pageSize?: number;
  uid: string;
};
export type LabsResourcesUidAuditsCreateByUidApiResponse =
  /** status 201  */ ResourceAuditItemByUidSerializersResourceAuditItemDetailResponseRead;
export type LabsResourcesUidAuditsCreateByUidApiArg = {
  /** Optional replay key, 1 to 128 characters (the audit tool sends a UUID), scoped to the auditor. Same key and body returns the stored audit with Idempotency-Replayed: true; same key with a different body returns 422 idempotency_key_reuse. Keys are kept with the audit for as long as the audit exists. */
  "Idempotency-Key"?: string;
  uid: string;
  recordResourceAuditRequest: RecordResourceAuditRequest;
};
export type LabsRoomsRetrieveApiResponse =
  /** status 200  */ RoomListSerializersRoomPaginatedResponseRead;
export type LabsRoomsRetrieveApiArg = {
  /** Comma-separated values; OR within this filter. */
  accessPolicy?: string;
  /** Comma-separated values; OR within this filter. */
  activityStatus?: string;
  /** Comma-separated values; OR within this filter. */
  buildingId?: string;
  /** Comma-separated values; OR within this filter. */
  cityId?: string;
  /** Comma-separated values; OR within this filter. */
  condition?: string;
  /** Comma-separated values; OR within this filter. */
  countryId?: string;
  createdAtAfter?: string;
  createdAtBefore?: string;
  /** Comma-separated values; OR within this filter. */
  groupId?: string;
  /** Comma-separated values; OR within this filter. */
  id?: string;
  /** Comma-separated values; OR within this filter. */
  lifecycleStatus?: string;
  ordering?: string;
  /** Comma-separated values; OR within this filter. */
  ownerId?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  /** Comma-separated values; OR within this filter. */
  status?: string;
};
export type LabsRoomsCreateApiResponse =
  /** status 201  */ RoomCreateSerializersRoomDetailResponseRead;
export type LabsRoomsCreateApiArg = {
  roomCreate: RoomCreate;
};
export type LabsRoomsMappingRetrieveByResourceIdApiResponse =
  /** status 200  */ ResourceMappingResponse;
export type LabsRoomsMappingRetrieveByResourceIdApiArg = {
  benchesCursor?: string;
  equipmentCursor?: string;
  licenseAssignmentsCursor?: string;
  licensesCursor?: string;
  pageSize?: number;
  resourceId: number;
  roomSlotsCursor?: string;
  roomsCursor?: string;
  stationSlotsCursor?: string;
  stationsCursor?: string;
};
export type LabsRoomsRetrieveByRoomIdApiResponse =
  /** status 200  */ RoomDetailSerializersRoomDetailResponseRead;
export type LabsRoomsRetrieveByRoomIdApiArg = {
  roomId: number;
};
export type LabsRoomsUpdateByRoomIdApiResponse =
  /** status 200  */ RoomReplaceSerializersRoomDetailResponseRead;
export type LabsRoomsUpdateByRoomIdApiArg = {
  roomId: number;
  roomUpdate: RoomUpdate;
};
export type LabsRoomsPartialUpdateByRoomIdApiResponse =
  /** status 200  */ RoomUpdateSerializersRoomDetailResponseRead;
export type LabsRoomsPartialUpdateByRoomIdApiArg = {
  roomId: number;
  patchedRoomUpdate: PatchedRoomUpdate;
};
export type LabsRoomsDestroyByRoomIdApiResponse = unknown;
export type LabsRoomsDestroyByRoomIdApiArg = {
  roomId: number;
};
export type LabsRoomsActionsChangeLifecycleCreateByRoomIdApiResponse =
  /** status 200  */ RoomLifecycleChangeSerializersRoomDetailResponseRead;
export type LabsRoomsActionsChangeLifecycleCreateByRoomIdApiArg = {
  roomId: number;
  roomLifecycleWrite: RoomLifecycleWrite;
};
export type LabsRoomsActionsChangeStatusCreateByRoomIdApiResponse =
  /** status 200  */ RoomStatusChangeSerializersRoomDetailResponseRead;
export type LabsRoomsActionsChangeStatusCreateByRoomIdApiArg = {
  roomId: number;
  roomStatusWrite: RoomStatusWrite;
};
export type LabsRoomsActionsGenerateSlotsCreateByRoomIdApiResponse =
  /** status 200  */ RoomSlotGenerateSerializersRoomSlotPaginatedResponseRead;
export type LabsRoomsActionsGenerateSlotsCreateByRoomIdApiArg = {
  roomId: number;
};
export type LabsRoomsExpensesRetrieveByRoomIdApiResponse =
  /** status 200  */ RoomExpenseListSerializersExpensePaginatedResponseRead;
export type LabsRoomsExpensesRetrieveByRoomIdApiArg = {
  page?: number;
  pageSize?: number;
  roomId: number;
};
export type LabsRoomsExpensesCreateByRoomIdApiResponse =
  /** status 201  */ RoomExpenseSerializersExpenseDetailResponseRead;
export type LabsRoomsExpensesCreateByRoomIdApiArg = {
  roomId: number;
  expenseWrite: ExpenseWrite;
};
export type LabsRoomsExpensesReportRetrieveByRoomIdApiResponse =
  /** status 200  */ RoomFinancialReportSerializersFinancialReportResponseDetailResponseRead;
export type LabsRoomsExpensesReportRetrieveByRoomIdApiArg = {
  billingPeriod?: string;
  currency?: string;
  expenseType?: string;
  fromDate?: string;
  pathRoomId: number;
  queryRoomId?: number;
  status?: string;
  toDate?: string;
};
export type LabsRoomsHistoryRetrieveByRoomIdApiResponse =
  /** status 200  */ RoomHistorySerializersRoomStatusRecordPaginatedResponseRead;
export type LabsRoomsHistoryRetrieveByRoomIdApiArg = {
  page?: number;
  pageSize?: number;
  roomId: number;
};
export type LabsRoomsImageRetrieveByRoomIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsRoomsImageRetrieveByRoomIdApiArg = {
  roomId: number;
};
export type LabsRoomsImageUpdateByRoomIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsRoomsImageUpdateByRoomIdApiArg = {
  roomId: number;
  resourceImageUpload: ResourceImageUpload;
};
export type LabsRoomsImageDestroyByRoomIdApiResponse = unknown;
export type LabsRoomsImageDestroyByRoomIdApiArg = {
  roomId: number;
};
export type LabsRoomsObservationsRetrieveByRoomIdApiResponse =
  /** status 200  */ RoomObservationListSerializersRoomObservationPaginatedResponseRead;
export type LabsRoomsObservationsRetrieveByRoomIdApiArg = {
  page?: number;
  pageSize?: number;
  roomId: number;
};
export type LabsRoomsObservationsCreateByRoomIdApiResponse =
  /** status 201  */ RoomObservationCreateSerializersRoomObservationDetailResponseRead;
export type LabsRoomsObservationsCreateByRoomIdApiArg = {
  roomId: number;
  roomObservationWrite: RoomObservationWrite;
};
export type LabsRoomsSlotsRetrieveByRoomIdApiResponse =
  /** status 200  */ RoomSlotListSerializersRoomSlotPaginatedResponseRead;
export type LabsRoomsSlotsRetrieveByRoomIdApiArg = {
  page?: number;
  pageSize?: number;
  roomId: number;
};
export type LabsRoomsFiltersRetrieveApiResponse =
  /** status 200  */ RoomFiltersFilteringFilterMetadataDetailResponse;
export type LabsRoomsFiltersRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsRoomsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsRoomsOptionsRetrieveApiArg = {
  buildingId?: number;
  cityId?: number;
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsRoomsStatusSummaryRetrieveApiResponse =
  /** status 200  */ RoomStatusSummaryDataSerializersRoomStatusSummaryDetailResponse;
export type LabsRoomsStatusSummaryRetrieveApiArg = void;
export type LabsStationTypesRetrieveApiResponse =
  /** status 200  */ StationTypeListSerializersStationTypePaginatedResponseRead;
export type LabsStationTypesRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsStationTypesCreateApiResponse =
  /** status 201  */ StationTypeCreateSerializersStationTypeDetailResponseRead;
export type LabsStationTypesCreateApiArg = {
  stationTypeWrite: StationTypeWrite;
};
export type LabsStationTypesRetrieveByTypeIdApiResponse =
  /** status 200  */ StationTypeDetailSerializersStationTypeDetailResponseRead;
export type LabsStationTypesRetrieveByTypeIdApiArg = {
  typeId: number;
};
export type LabsStationTypesPartialUpdateByTypeIdApiResponse =
  /** status 200  */ StationTypeUpdateSerializersStationTypeDetailResponseRead;
export type LabsStationTypesPartialUpdateByTypeIdApiArg = {
  typeId: number;
  patchedStationTypeWrite: PatchedStationTypeWrite;
};
export type LabsStationTypesDestroyByTypeIdApiResponse = unknown;
export type LabsStationTypesDestroyByTypeIdApiArg = {
  typeId: number;
};
export type LabsStationTypesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsStationTypesOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type LabsStationsRetrieveApiResponse =
  /** status 200  */ StationListSerializersStationPaginatedResponseRead;
export type LabsStationsRetrieveApiArg = {
  /** Comma-separated values; OR within this filter. */
  accessPolicy?: string;
  /** Comma-separated values; OR within this filter. */
  activityStatus?: string;
  /** Comma-separated values; OR within this filter. */
  condition?: string;
  createdAtAfter?: string;
  createdAtBefore?: string;
  /** Comma-separated values; OR within this filter. */
  groupId?: string;
  /** Comma-separated values; OR within this filter. */
  id?: string;
  /** Comma-separated values; OR within this filter. */
  lifecycleStatus?: string;
  ordering?: string;
  /** Comma-separated values; OR within this filter. */
  ownerId?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  /** Comma-separated values; OR within this filter. */
  roomId?: string;
  /** Comma-separated values; OR within this filter. */
  status?: string;
  /** Comma-separated values; OR within this filter. */
  typeId?: string;
};
export type LabsStationsCreateApiResponse =
  /** status 201  */ StationCreateSerializersStationDetailResponseRead;
export type LabsStationsCreateApiArg = {
  stationCreate: StationCreate;
};
export type LabsStationsMappingRetrieveByResourceIdApiResponse =
  /** status 200  */ ResourceMappingResponse;
export type LabsStationsMappingRetrieveByResourceIdApiArg = {
  benchesCursor?: string;
  equipmentCursor?: string;
  licenseAssignmentsCursor?: string;
  licensesCursor?: string;
  pageSize?: number;
  resourceId: number;
  roomSlotsCursor?: string;
  roomsCursor?: string;
  stationSlotsCursor?: string;
  stationsCursor?: string;
};
export type LabsStationsRetrieveByStationIdApiResponse =
  /** status 200  */ StationDetailSerializersStationDetailResponseRead;
export type LabsStationsRetrieveByStationIdApiArg = {
  stationId: number;
};
export type LabsStationsUpdateByStationIdApiResponse =
  /** status 200  */ StationReplaceSerializersStationDetailResponseRead;
export type LabsStationsUpdateByStationIdApiArg = {
  stationId: number;
  stationUpdate: StationUpdate;
};
export type LabsStationsPartialUpdateByStationIdApiResponse =
  /** status 200  */ StationUpdateSerializersStationDetailResponseRead;
export type LabsStationsPartialUpdateByStationIdApiArg = {
  stationId: number;
  patchedStationUpdate: PatchedStationUpdate;
};
export type LabsStationsDestroyByStationIdApiResponse = unknown;
export type LabsStationsDestroyByStationIdApiArg = {
  stationId: number;
};
export type LabsStationsActionsChangeLifecycleCreateByStationIdApiResponse =
  /** status 200  */ StationLifecycleChangeSerializersStationDetailResponseRead;
export type LabsStationsActionsChangeLifecycleCreateByStationIdApiArg = {
  stationId: number;
  stationLifecycleWrite: StationLifecycleWrite;
};
export type LabsStationsActionsChangeStatusCreateByStationIdApiResponse =
  /** status 200  */ StationStatusChangeSerializersStationDetailResponseRead;
export type LabsStationsActionsChangeStatusCreateByStationIdApiArg = {
  stationId: number;
  stationStatusWrite: StationStatusWrite;
};
export type LabsStationsActionsPlaceCreateByStationIdApiResponse =
  /** status 200  */ StationPlaceActionSerializersStationDetailResponseRead;
export type LabsStationsActionsPlaceCreateByStationIdApiArg = {
  stationId: number;
  stationPlacement: StationPlacement;
};
export type LabsStationsActionsPlacePartialUpdateByStationIdApiResponse =
  /** status 200  */ StationPlacementSerializersStationDetailResponseRead;
export type LabsStationsActionsPlacePartialUpdateByStationIdApiArg = {
  stationId: number;
  patchedStationPlacement: PatchedStationPlacement;
};
export type LabsStationsHistoryRetrieveByStationIdApiResponse =
  /** status 200  */ StationHistorySerializersStationStatusRecordPaginatedResponseRead;
export type LabsStationsHistoryRetrieveByStationIdApiArg = {
  page?: number;
  pageSize?: number;
  stationId: number;
};
export type LabsStationsImageRetrieveByStationIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsStationsImageRetrieveByStationIdApiArg = {
  stationId: number;
};
export type LabsStationsImageUpdateByStationIdApiResponse =
  /** status 200  */ ResourceImageResourceImagesResourceImageDetailResponseRead;
export type LabsStationsImageUpdateByStationIdApiArg = {
  stationId: number;
  resourceImageUpload: ResourceImageUpload;
};
export type LabsStationsImageDestroyByStationIdApiResponse = unknown;
export type LabsStationsImageDestroyByStationIdApiArg = {
  stationId: number;
};
export type LabsStationsSlotsRetrieveByStationIdApiResponse =
  /** status 200  */ StationSlotListSerializersStationSlotPaginatedResponseRead;
export type LabsStationsSlotsRetrieveByStationIdApiArg = {
  page?: number;
  pageSize?: number;
  stationId: number;
};
export type LabsStationsSlotsCreateByStationIdApiResponse =
  /** status 201  */ StationSlotCreateSerializersStationSlotDetailResponseRead;
export type LabsStationsSlotsCreateByStationIdApiArg = {
  stationId: number;
  stationSlotCreate: StationSlotCreate;
};
export type LabsStationsSlotsRetrieveByStationIdSlotIdApiResponse =
  /** status 200  */ StationSlotDetailSerializersStationSlotDetailResponseRead;
export type LabsStationsSlotsRetrieveByStationIdSlotIdApiArg = {
  slotId: number;
  stationId: number;
};
export type LabsStationsSlotsUpdateByStationIdSlotIdApiResponse =
  /** status 200  */ StationSlotReplaceSerializersStationSlotDetailResponseRead;
export type LabsStationsSlotsUpdateByStationIdSlotIdApiArg = {
  slotId: number;
  stationId: number;
  stationSlotUpdate: StationSlotUpdate;
};
export type LabsStationsSlotsPartialUpdateByStationIdSlotIdApiResponse =
  /** status 200  */ StationSlotUpdateSerializersStationSlotDetailResponseRead;
export type LabsStationsSlotsPartialUpdateByStationIdSlotIdApiArg = {
  slotId: number;
  stationId: number;
  patchedStationSlotUpdate: PatchedStationSlotUpdate;
};
export type LabsStationsSlotsDestroyByStationIdSlotIdApiResponse = unknown;
export type LabsStationsSlotsDestroyByStationIdSlotIdApiArg = {
  slotId: number;
  stationId: number;
};
export type LabsStationsFiltersRetrieveApiResponse =
  /** status 200  */ StationFiltersFilteringFilterMetadataDetailResponse;
export type LabsStationsFiltersRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type LabsStationsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type LabsStationsOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
  roomId?: number;
  stationTypeId?: number;
};
export type LabsStationsReferenceDataRetrieveApiResponse =
  /** status 200  */ StationReferenceDataSerializersStationReferenceDataDetailResponseRead;
export type LabsStationsReferenceDataRetrieveApiArg = void;
export type LabsStationsStatusSummaryRetrieveApiResponse =
  /** status 200  */ StationStatusSummaryDataSerializersStationStatusSummaryDetailResponse;
export type LabsStationsStatusSummaryRetrieveApiArg = void;
export type LabsWorkbookImportsActionsApplyCreateApiResponse =
  /** status 200  */ WorkbookImportApplySerializersImportReportDetailResponseRead;
export type LabsWorkbookImportsActionsApplyCreateApiArg = {
  workbookUpload: WorkbookUpload;
};
export type LabsWorkbookImportsActionsCheckCreateApiResponse =
  /** status 200  */ WorkbookImportCheckSerializersImportReportDetailResponseRead;
export type LabsWorkbookImportsActionsCheckCreateApiArg = {
  workbookUpload: WorkbookUpload;
};
export type LabsWorkbookImportsExportRetrieveApiResponse =
  /** status 200  */ Blob;
export type LabsWorkbookImportsExportRetrieveApiArg = void;
export type LabsWorkbookImportsTemplateRetrieveApiResponse =
  /** status 200  */ Blob;
export type LabsWorkbookImportsTemplateRetrieveApiArg = void;
export type LoginCreateApiResponse =
  /** status 200  */ LoginSerializerLoginResponseDetailResponse;
export type LoginCreateApiArg = {
  login: LoginWrite;
};
export type LogoutCreateApiResponse = unknown;
export type LogoutCreateApiArg = void;
export type NotificationsListApiResponse =
  /** status 200  */ NotificationSerializerNotificationPaginatedResponseRead;
export type NotificationsListApiArg = {
  /** A page number within the paginated result set. */
  page?: number;
  /** Number of results to return per page. */
  pageSize?: number;
  /** Reconnection cursor: return only notifications whose id is greater than this value. Pass the highest id already received. */
  since?: number;
  /** Return only notifications targeted at this user; broadcasts are excluded. Only the caller's own id is honoured: any other id returns an empty page. */
  userId?: number;
};
export type NotificationsCreateApiResponse =
  /** status 201  */ NotificationSerializerNotificationDetailResponseRead;
export type NotificationsCreateApiArg = {
  notificationWrite: NotificationWrite;
};
export type RefreshTokenCreateApiResponse =
  /** status 200  */ RefreshTokenSerializerRefreshTokenResponseDetailResponse;
export type RefreshTokenCreateApiArg = void;
export type SchemaRetrieveApiResponse = /** status 200  */ {
  [key: string]: any;
};
export type SchemaRetrieveApiArg = {
  format?: "json" | "yaml";
  lang?:
    | "af"
    | "ar"
    | "ar-dz"
    | "ast"
    | "az"
    | "be"
    | "bg"
    | "bn"
    | "br"
    | "bs"
    | "ca"
    | "ckb"
    | "cs"
    | "cy"
    | "da"
    | "de"
    | "dsb"
    | "el"
    | "en"
    | "en-au"
    | "en-gb"
    | "eo"
    | "es"
    | "es-ar"
    | "es-co"
    | "es-mx"
    | "es-ni"
    | "es-ve"
    | "et"
    | "eu"
    | "fa"
    | "fi"
    | "fr"
    | "fy"
    | "ga"
    | "gd"
    | "gl"
    | "he"
    | "hi"
    | "hr"
    | "hsb"
    | "hu"
    | "hy"
    | "ia"
    | "id"
    | "ig"
    | "io"
    | "is"
    | "it"
    | "ja"
    | "ka"
    | "kab"
    | "kk"
    | "km"
    | "kn"
    | "ko"
    | "ky"
    | "lb"
    | "lt"
    | "lv"
    | "mk"
    | "ml"
    | "mn"
    | "mr"
    | "ms"
    | "my"
    | "nb"
    | "ne"
    | "nl"
    | "nn"
    | "os"
    | "pa"
    | "pl"
    | "pt"
    | "pt-br"
    | "ro"
    | "ru"
    | "sk"
    | "sl"
    | "sq"
    | "sr"
    | "sr-latn"
    | "sv"
    | "sw"
    | "ta"
    | "te"
    | "tg"
    | "th"
    | "tk"
    | "tr"
    | "tt"
    | "udm"
    | "ug"
    | "uk"
    | "ur"
    | "uz"
    | "vi"
    | "zh-hans"
    | "zh-hant";
};
export type SendOtpCreateApiResponse =
  /** status 200  */ SendOtpSerializerSendOtpResponseDetailResponse;
export type SendOtpCreateApiArg = {
  sendOtp: SendOtp;
};
export type SupportAdminCannedResponsesRetrieveApiResponse =
  /** status 200  */ AdminCannedResponseListSerializersCannedResponseListResponseRead;
export type SupportAdminCannedResponsesRetrieveApiArg = void;
export type SupportAdminCannedResponsesCreateApiResponse =
  /** status 201  */ AdminCannedResponseCreateSerializersCannedResponseDetailResponseRead;
export type SupportAdminCannedResponsesCreateApiArg = {
  adminCannedResponseCreate: AdminCannedResponseCreate;
};
export type SupportAdminCannedResponsesPartialUpdateByResponseIdApiResponse =
  /** status 200  */ AdminCannedResponseUpdateSerializersCannedResponseDetailResponseRead;
export type SupportAdminCannedResponsesPartialUpdateByResponseIdApiArg = {
  responseId: number;
  patchedAdminCannedResponseUpdate: PatchedAdminCannedResponseUpdate;
};
export type SupportAdminCannedResponsesDestroyByResponseIdApiResponse = unknown;
export type SupportAdminCannedResponsesDestroyByResponseIdApiArg = {
  responseId: number;
};
export type SupportAdminSettingsRetrieveApiResponse =
  /** status 200  */ AdminSettingsDetailSerializersSupportSettingsDetailResponseRead;
export type SupportAdminSettingsRetrieveApiArg = void;
export type SupportAdminSettingsPartialUpdateApiResponse =
  /** status 200  */ AdminSettingsUpdateSerializersSupportSettingsDetailResponseRead;
export type SupportAdminSettingsPartialUpdateApiArg = {
  patchedAdminSettingsUpdate: PatchedAdminSettingsUpdate;
};
export type SupportAdminTransitionsRetrieveApiResponse =
  /** status 200  */ AdminTransitionListSerializersStatusTransitionListResponseRead;
export type SupportAdminTransitionsRetrieveApiArg = void;
export type SupportAdminTransitionsCreateApiResponse =
  /** status 201  */ AdminTransitionCreateSerializersStatusTransitionDetailResponseRead;
export type SupportAdminTransitionsCreateApiArg = {
  adminTransitionCreate: AdminTransitionCreate;
};
export type SupportAdminTransitionsPartialUpdateByTransitionIdApiResponse =
  /** status 200  */ AdminTransitionUpdateSerializersStatusTransitionDetailResponseRead;
export type SupportAdminTransitionsPartialUpdateByTransitionIdApiArg = {
  transitionId: number;
  patchedAdminTransitionUpdate: PatchedAdminTransitionUpdate;
};
export type SupportAdminTransitionsDestroyByTransitionIdApiResponse = unknown;
export type SupportAdminTransitionsDestroyByTransitionIdApiArg = {
  transitionId: number;
};
export type SupportAttachmentsDownloadRetrieveByAttachmentIdApiResponse =
  /** status 200 Clean attachment binary (stored content type) */ Blob;
export type SupportAttachmentsDownloadRetrieveByAttachmentIdApiArg = {
  attachmentId: number;
};
export type SupportCannedResponsesRetrieveApiResponse =
  /** status 200  */ CannedResponseListSerializersCannedResponseListResponseRead;
export type SupportCannedResponsesRetrieveApiArg = void;
export type SupportCategoriesRetrieveApiResponse =
  /** status 200  */ AdminCategoryListSerializersCategoryListResponseRead;
export type SupportCategoriesRetrieveApiArg = void;
export type SupportCategoriesCreateApiResponse =
  /** status 201  */ AdminCategoryCreateSerializersCategoryDetailResponseRead;
export type SupportCategoriesCreateApiArg = {
  adminCategoryCreate: AdminCategoryCreate;
};
export type SupportCategoriesPartialUpdateByCategoryIdApiResponse =
  /** status 200  */ AdminCategoryUpdateSerializersCategoryDetailResponseRead;
export type SupportCategoriesPartialUpdateByCategoryIdApiArg = {
  categoryId: number;
  patchedAdminCategoryUpdate: PatchedAdminCategoryUpdate;
};
export type SupportCategoriesDestroyByCategoryIdApiResponse = unknown;
export type SupportCategoriesDestroyByCategoryIdApiArg = {
  categoryId: number;
};
export type SupportCategoriesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type SupportCategoriesOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type SupportLabelsRetrieveApiResponse =
  /** status 200  */ AdminLabelListSerializersLabelListResponseRead;
export type SupportLabelsRetrieveApiArg = void;
export type SupportLabelsCreateApiResponse =
  /** status 201  */ AdminLabelCreateSerializersLabelDetailResponseRead;
export type SupportLabelsCreateApiArg = {
  adminLabelCreate: AdminLabelCreate;
};
export type SupportLabelsPartialUpdateByLabelIdApiResponse =
  /** status 200  */ AdminLabelUpdateSerializersLabelDetailResponseRead;
export type SupportLabelsPartialUpdateByLabelIdApiArg = {
  labelId: number;
  patchedAdminLabelUpdate: PatchedAdminLabelUpdate;
};
export type SupportLabelsDestroyByLabelIdApiResponse = unknown;
export type SupportLabelsDestroyByLabelIdApiArg = {
  labelId: number;
};
export type SupportLabelsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type SupportLabelsOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type SupportPrioritiesRetrieveApiResponse =
  /** status 200  */ AdminPriorityListSerializersPriorityListResponseRead;
export type SupportPrioritiesRetrieveApiArg = void;
export type SupportPrioritiesCreateApiResponse =
  /** status 201  */ AdminPriorityCreateSerializersPriorityDetailResponseRead;
export type SupportPrioritiesCreateApiArg = {
  adminPriorityCreate: AdminPriorityCreate;
};
export type SupportPrioritiesPartialUpdateByPriorityIdApiResponse =
  /** status 200  */ AdminPriorityUpdateSerializersPriorityDetailResponseRead;
export type SupportPrioritiesPartialUpdateByPriorityIdApiArg = {
  priorityId: number;
  patchedAdminPriorityUpdate: PatchedAdminPriorityUpdate;
};
export type SupportPrioritiesDestroyByPriorityIdApiResponse = unknown;
export type SupportPrioritiesDestroyByPriorityIdApiArg = {
  priorityId: number;
};
export type SupportPrioritiesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type SupportPrioritiesOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type SupportResourcesTicketsRetrieveByResourceTypeResourceIdApiResponse =
  /** status 200  */ ResourceTicketSummarySerializersResourceTicketSummaryDetailResponseRead;
export type SupportResourcesTicketsRetrieveByResourceTypeResourceIdApiArg = {
  resourceId: string;
  resourceType: string;
};
export type SupportStatusesRetrieveApiResponse =
  /** status 200  */ AdminStatusListSerializersStatusListResponseRead;
export type SupportStatusesRetrieveApiArg = void;
export type SupportStatusesCreateApiResponse =
  /** status 201  */ AdminStatusCreateSerializersStatusDetailResponseRead;
export type SupportStatusesCreateApiArg = {
  adminStatusCreate: AdminStatusCreate;
};
export type SupportStatusesPartialUpdateByStatusIdApiResponse =
  /** status 200  */ AdminStatusUpdateSerializersStatusDetailResponseRead;
export type SupportStatusesPartialUpdateByStatusIdApiArg = {
  statusId: number;
  patchedAdminStatusUpdate: PatchedAdminStatusUpdate;
};
export type SupportStatusesOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type SupportStatusesOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
  /** * `open` - Open
   * `active` - Active
   * `waiting` - Waiting
   * `done` - Done */
  systemState?: "open" | "active" | "waiting" | "done";
};
export type SupportTeamsRetrieveApiResponse =
  /** status 200  */ AdminTeamListSerializersTeamListResponseRead;
export type SupportTeamsRetrieveApiArg = void;
export type SupportTeamsCreateApiResponse =
  /** status 201  */ AdminTeamCreateSerializersTeamDetailResponseRead;
export type SupportTeamsCreateApiArg = {
  adminTeamCreate: AdminTeamCreate;
};
export type SupportTeamsPartialUpdateByTeamIdApiResponse =
  /** status 200  */ AdminTeamUpdateSerializersTeamDetailResponseRead;
export type SupportTeamsPartialUpdateByTeamIdApiArg = {
  teamId: number;
  patchedAdminTeamUpdate: PatchedAdminTeamUpdate;
};
export type SupportTeamsDestroyByTeamIdApiResponse = unknown;
export type SupportTeamsDestroyByTeamIdApiArg = {
  teamId: number;
};
export type SupportTeamsOptionsRetrieveApiResponse =
  /** status 200 Standard selector options list */ CatalogOptionListRead;
export type SupportTeamsOptionsRetrieveApiArg = {
  /** Comma-separated positive integers (at most 50) of retired rows to include. */
  includeIds?: number[];
  /** Search text (1 to 100 characters). */
  q?: string;
};
export type SupportTicketsRetrieveApiResponse =
  /** status 200  */ TicketListSerializersTicketListPaginatedResponseRead;
export type SupportTicketsRetrieveApiArg = {
  assigneeId?: number;
  categoryId?: number;
  createdAfter?: string;
  createdBefore?: string;
  externalReference?: string;
  impact?: string;
  key?: string;
  label?: string;
  noTeam?: boolean;
  ordering?: string;
  page?: number;
  pageSize?: number;
  parentKey?: string;
  priorityId?: number;
  q?: string;
  requesterId?: number;
  resolutionCode?: string;
  resolutionDueAfter?: string;
  resolutionDueBefore?: string;
  resourceId?: string;
  resourceType?: string;
  source?: string;
  status?: string;
  statusId?: number;
  systemState?: string;
  teamId?: number;
  ticketType?: string;
  unassigned?: boolean;
  updatedAfter?: string;
  updatedBefore?: string;
  urgency?: string;
  watcherId?: number;
};
export type SupportTicketsCreateApiResponse =
  /** status 201  */ TicketCreateSerializersTicketDetailDetailResponseRead;
export type SupportTicketsCreateApiArg = {
  ticketCreateRequest: TicketCreateRequest;
};
export type SupportTicketsRetrieveByKeyApiResponse =
  /** status 200  */ TicketDetailSerializersTicketDetailDetailResponseRead;
export type SupportTicketsRetrieveByKeyApiArg = {
  key: string;
};
export type SupportTicketsPartialUpdateByKeyApiResponse =
  /** status 200  */ TicketUpdateSerializersTicketDetailDetailResponseRead;
export type SupportTicketsPartialUpdateByKeyApiArg = {
  key: string;
  patchedTicketUpdateRequest: PatchedTicketUpdateRequest;
};
export type SupportTicketsActionsAssignCreateByKeyApiResponse =
  /** status 200  */ TicketAssignSerializersTicketDetailDetailResponseRead;
export type SupportTicketsActionsAssignCreateByKeyApiArg = {
  key: string;
  ticketAssignRequest: TicketAssignRequest;
};
export type SupportTicketsActionsSubmitCsatCreateByKeyApiResponse =
  /** status 200  */ TicketCsatSerializersTicketDetailDetailResponseRead;
export type SupportTicketsActionsSubmitCsatCreateByKeyApiArg = {
  key: string;
  csatRequest: CsatRequest;
};
export type SupportTicketsActionsTransitionCreateByKeyApiResponse =
  /** status 200  */ TicketTransitionSerializersTicketDetailDetailResponseRead;
export type SupportTicketsActionsTransitionCreateByKeyApiArg = {
  key: string;
  ticketTransitionRequest: TicketTransitionRequest;
};
export type SupportTicketsActivityRetrieveByKeyApiResponse =
  /** status 200  */ TicketActivityListSerializersTicketActivityListResponseRead;
export type SupportTicketsActivityRetrieveByKeyApiArg = {
  key: string;
};
export type SupportTicketsAttachmentsCreateByKeyApiResponse =
  /** status 201  */ TicketAttachmentCreateSerializersTicketAttachmentDetailResponseRead;
export type SupportTicketsAttachmentsCreateByKeyApiArg = {
  key: string;
  attachmentUploadRequest: AttachmentUploadRequest;
};
export type SupportTicketsAttachmentsDestroyByKeyAttachmentIdApiResponse =
  unknown;
export type SupportTicketsAttachmentsDestroyByKeyAttachmentIdApiArg = {
  attachmentId: number;
  key: string;
};
export type SupportTicketsCommentsRetrieveByKeyApiResponse =
  /** status 200  */ TicketCommentListSerializersTicketCommentListResponseRead;
export type SupportTicketsCommentsRetrieveByKeyApiArg = {
  key: string;
};
export type SupportTicketsCommentsCreateByKeyApiResponse =
  /** status 201  */ TicketCommentCreateSerializersTicketCommentDetailResponseRead;
export type SupportTicketsCommentsCreateByKeyApiArg = {
  key: string;
  commentCreateRequest: CommentCreateRequest;
};
export type SupportTicketsCommentsPartialUpdateByKeyCommentIdApiResponse =
  /** status 200  */ TicketCommentUpdateSerializersTicketCommentDetailResponseRead;
export type SupportTicketsCommentsPartialUpdateByKeyCommentIdApiArg = {
  commentId: number;
  key: string;
  patchedCommentUpdateRequest: PatchedCommentUpdateRequest;
};
export type SupportTicketsCommentsDestroyByKeyCommentIdApiResponse = unknown;
export type SupportTicketsCommentsDestroyByKeyCommentIdApiArg = {
  commentId: number;
  key: string;
};
export type SupportTicketsLinksRetrieveByKeyApiResponse =
  /** status 200  */ TicketLinkListSerializersTicketLinkListResponseRead;
export type SupportTicketsLinksRetrieveByKeyApiArg = {
  key: string;
};
export type SupportTicketsLinksCreateByKeyApiResponse =
  /** status 201  */ TicketLinkCreateSerializersTicketLinkDetailResponseRead;
export type SupportTicketsLinksCreateByKeyApiArg = {
  key: string;
  ticketLinkRequest: TicketLinkRequest;
};
export type SupportTicketsLinksDestroyByKeyLinkIdApiResponse = unknown;
export type SupportTicketsLinksDestroyByKeyLinkIdApiArg = {
  key: string;
  linkId: number;
};
export type SupportTicketsResourcesCreateByKeyApiResponse =
  /** status 201  */ TicketResourceLinkCreateSerializersTicketResourceLinkDetailResponseRead;
export type SupportTicketsResourcesCreateByKeyApiArg = {
  key: string;
  linkResourceRequest: LinkResourceRequest;
};
export type SupportTicketsResourcesDestroyByKeyApiResponse = unknown;
export type SupportTicketsResourcesDestroyByKeyApiArg = {
  key: string;
};
export type SupportTicketsWatchersCreateByKeyApiResponse =
  /** status 201  */ TicketWatcherAddSerializersWatcherDetailResponseRead;
export type SupportTicketsWatchersCreateByKeyApiArg = {
  key: string;
  watcherRequest: WatcherRequest;
};
export type SupportTicketsWatchersDestroyByKeyApiResponse = unknown;
export type SupportTicketsWatchersDestroyByKeyApiArg = {
  key: string;
};
export type SupportTicketsStatsRetrieveApiResponse =
  /** status 200  */ SupportQueueStatsSerializersQueueStatsDetailResponseRead;
export type SupportTicketsStatsRetrieveApiArg = {
  days?: number;
};
export type UserGroupsRetrieveApiResponse =
  /** status 200  */ UserGroupListApiUserGroupPaginatedResponseRead;
export type UserGroupsRetrieveApiArg = {
  page?: number;
  pageSize?: number;
};
export type UserGroupsUsersRetrieveByGroupIdApiResponse =
  /** status 200  */ UserGroupMemberListApiUserGroupMemberPaginatedResponseRead;
export type UserGroupsUsersRetrieveByGroupIdApiArg = {
  groupId: number;
  page?: number;
  pageSize?: number;
};
export type UsersRetrieveApiResponse =
  /** status 200  */ UsersSerializersUserPaginatedResponseRead;
export type UsersRetrieveApiArg = {
  page?: number;
  pageSize?: number;
  username?: string;
};
export type UsersRetrieveByIdApiResponse =
  /** status 200  */ UserSerializersUserDetailResponseRead;
export type UsersRetrieveByIdApiArg = {
  id: number;
};
export type UsersPartialUpdateByIdApiResponse =
  /** status 200  */ UserSerializersUserDetailResponseRead;
export type UsersPartialUpdateByIdApiArg = {
  id: number;
  patchedUpdateUser: PatchedUpdateUser;
};
export type UsersAvatarRetrieveApiResponse =
  /** status 200  */ UserAvatarSerializersUserAvatarReadDetailResponseRead;
export type UsersAvatarRetrieveApiArg = void;
export type UsersAvatarCreateApiResponse =
  /** status 200  */ UserAvatarSerializersUserAvatarReadDetailResponseRead;
export type UsersAvatarCreateApiArg = {
  userAvatarUpload: UserAvatarUpload;
};
export type UsersAvatarDestroyApiResponse = unknown;
export type UsersAvatarDestroyApiArg = void;
export type UsersMeRetrieveApiResponse =
  /** status 200  */ CurrentUserSerializersUserWithPermissionDetailResponseRead;
export type UsersMeRetrieveApiArg = void;
export type GetInternalChangesApiResponse =
  /** status 200 Change delta or reset signal */ ChangesResponse;
export type GetInternalChangesApiArg = {
  /** Stream entity type (users, agents) */
  entity: string;
  /** Held epoch UUID */
  epoch: string;
  /** Max winners per page (1..2000) */
  limit?: number;
  /** Last seen version cursor */
  since: number;
  /** Long-poll timeout in seconds (0..30) */
  wait?: number;
};
export type GetInternalDigestApiResponse =
  /** status 200 Live stream digest and version */ DigestResponse;
export type GetInternalDigestApiArg = {
  /** Stream entity type (users, agents) */
  entity: string;
};
export type GetInternalInfoApiResponse =
  /** status 200 Backend sync metadata and available streams */ SyncInfoResponse;
export type GetInternalInfoApiArg = void;
export type GetInternalSnapshotApiResponse =
  /** status 200 Snapshot page of live claims */ SnapshotResponse;
export type GetInternalSnapshotApiArg = {
  /** Keyset pagination cursor */
  after?: string;
  /** Stream entity type (users, agents) */
  entity: string;
  /** Page limit (1..5000) */
  limit?: number;
};
export type AgentBookingCheckInData = {
  /** True when the booking is now in progress for this login. */
  is_checked_in: boolean;
  /** Present only when checked in. */
  booking_code?: string;
  /** Present only when checked in. */
  starts_at?: string;
  /** Present only when checked in. */
  ends_at?: string;
  /** Username the booking is for; present only when checked in. */
  booked_for?: string | null;
};
export type AgentBookingCheckInResponse = {
  data: AgentBookingCheckInData;
};
export type ErrorDetailItem = {
  field?: string;
  message: string;
};
export type ErrorBody = {
  code: string;
  message: string;
  details: ErrorDetailItem[];
  request_id: string;
};
export type ErrorEnvelope = {
  error: ErrorBody;
};
export type AgentBookingValidationRequest = {
  booking_code: string;
};
export type AgentBookingCompleteData = {
  /** True when the booking is now completed. */
  is_completed: boolean;
  /** Present only when completed. */
  booking_code?: string;
  /** Present only when completed. */
  starts_at?: string;
  /** The booked end time, unchanged; present only when completed. */
  ends_at?: string;
};
export type AgentBookingCompleteResponse = {
  data: AgentBookingCompleteData;
};
export type AgentBookingExtendData = {
  /** True when the booking now ends at ends_at. */
  is_extended: boolean;
  /** Present only when extended. */
  booking_code?: string;
  /** Present only when extended. */
  starts_at?: string;
  /** The new end; present only when extended. */
  ends_at?: string;
};
export type AgentBookingExtendResponse = {
  data: AgentBookingExtendData;
};
export type AgentBookingExtendErrorBody = {
  code: string;
  message: string;
  details: (
    | {
        field: string;
        code:
          | "already_ended"
          | "not_later"
          | "too_short"
          | "needs_approval"
          | "bench_not_in_service"
          | "bench_not_free";
        message: string;
        limit_at: string | null;
      }
    | {
        field?: string;
        message: string;
      }
  )[];
  request_id: string;
};
export type AgentBookingExtendError = {
  error: AgentBookingExtendErrorBody;
};
export type AgentBookingExtendRequest = {
  booking_code: string;
  /** The new end time. Seconds are dropped. */
  ends_at: string;
};
export type AgentBookingValidationData = {
  is_eligible: boolean;
  /** Present only when eligible. */
  booking_code?: string;
  /** Present only when eligible. */
  starts_at?: string;
  /** Present only when eligible. */
  ends_at?: string;
  /** Username the booking is for; present only when eligible. */
  booked_for?: string | null;
};
export type AgentBookingValidationResponse = {
  data: AgentBookingValidationData;
};
export type ObservationAcknowledgment = {
  batch_key: string;
  sequence: number;
  received_at: string;
};
export type Choice = {};
export type ChoiceRead = {
  value: string;
  label: string;
};
export type ObservationAcknowledgmentRead = {
  batch_key: string;
  sequence: number;
  disposition: ChoiceRead;
  received_at: string;
};
export type AgentDeviceObservationsObservationSerializersObservationAcknowledgmentDetailResponse =
  {
    data: ObservationAcknowledgment;
  };
export type AgentDeviceObservationsObservationSerializersObservationAcknowledgmentDetailResponseRead =
  {
    data: ObservationAcknowledgmentRead;
  };
export type ProblemDetail = {
  code: string;
  message: string;
  details: {
    [key: string]: any;
  }[];
  request_id: string;
};
export type ProblemResponseEnvelope = {
  error: ProblemDetail;
};
export type StateEnum = "connected" | "disconnected";
export type EquipmentHardwareIdKindEnum = "pnp_id" | "vector_device";
export type HardwareId = {
  kind: EquipmentHardwareIdKindEnum;
  value: string;
};
export type DeviceObservation = {
  observation_key: string;
  interface_name: string;
  state: StateEnum;
  name?: string;
  /** Evidence only; not used for matching. */
  serial_number?: string;
  /** IDs read from the device (Windows PnP instance ID); matched to registered equipment IDs. */
  hardware_ids?: HardwareId[];
};
export type DeviceObservationReport = {
  generation_key: string;
  collector_key: string;
  sequence: number;
  collected_at: string;
  is_complete: boolean;
  devices: DeviceObservation[];
};
export type AgentIdentity = {};
export type LabsNamedReference = {};
export type LabsNamedReferenceRead = {
  id: number;
  name: string;
};
export type AgentIdentityRead = {
  id: number;
  agent_uid: string;
  equipment: LabsNamedReferenceRead | null;
  state: ChoiceRead;
  /** Liveness of an active agent from last_seen_at: online, delayed or offline (also offline before the first heartbeat). Null while pending and once revoked or decommissioned; read state then. */
  health: ChoiceRead | null;
  key_algorithm: ChoiceRead | null;
  key_storage: ChoiceRead | null;
  fingerprint: string;
  agent_version: string;
  last_seen_at: string | null;
  enrolled_at: string | null;
  created_at: string;
  updated_at: string;
};
export type AgentDetailResponse = {
  data: AgentIdentity;
};
export type AgentDetailResponseRead = {
  data: AgentIdentityRead;
};
export type KeyStorageEnum = "tpm" | "os_keystore" | "software";
export type EnrollAgentRequest = {
  grant: string;
  public_key: string;
  key_storage: KeyStorageEnum;
  fingerprint?: string;
  agent_version: string;
  proof: string;
};
export type AgentActivityData = {
  remote_user: string;
  remote_user_display_name: string;
  remote_computer: string;
  remote_ip: string | null;
  booking_code: string;
  offline_at: string | null;
  inactive_at: string | null;
  last_agent_report_at: string | null;
};
export type AgentActivityDataRead = {
  status: ChoiceRead;
  remote_user: string;
  remote_user_display_name: string;
  remote_computer: string;
  remote_ip: string | null;
  booking_code: string;
  offline_at: string | null;
  inactive_at: string | null;
  last_agent_report_at: string | null;
};
export type AgentActivityResponse = {
  data: AgentActivityData;
};
export type AgentActivityResponseRead = {
  data: AgentActivityDataRead;
};
export type ComputingActivityStatusEnum =
  "offline" | "free" | "active" | "inactive" | "maintaining";
export type PatchedAgentActivityReport = {
  status?: ComputingActivityStatusEnum;
  remote_user?: string;
  remote_user_display_name?: string;
  remote_computer?: string;
  remote_ip?: string | null;
  booking_code?: string;
};
export type AgentHeartbeatResponseData = {
  status: string;
  last_seen_at: string;
};
export type AgentHeartbeatResponse = {
  data: AgentHeartbeatResponseData;
};
export type AgentHeartbeatRequest = {
  agent_uid?: string;
};
export type AgentInfoResponseData = {
  /** Logical name of this department backend (routing-sync backend_id). */
  backend_key: string;
  server_time: string;
  capabilities: string[];
  /** Paths of the agent routes this backend serves, keyed by capability. */
  endpoints: {
    [key: string]: string;
  };
};
export type AgentInfoResponse = {
  data: AgentInfoResponseData;
};
export type PolicyHardwareId = {
  kind: string;
  value: string;
};
export type ExpectedDeviceWatch = {
  equipment_uid: string;
  name: string;
  hardware_ids: PolicyHardwareId[];
};
export type MonitoringPolicy = {
  generation_key: string;
  max_devices: number;
  max_body_bytes: number;
  freshness_seconds: number;
  interface_names: string[];
  /** Equipment expected on this computer with their registered hardware IDs: the agent reports only devices whose ID is listed here. */
  expected_devices: ExpectedDeviceWatch[];
};
export type AgentMonitoringPolicyObservationSerializersMonitoringPolicyDetailResponse =
  {
    data: MonitoringPolicy;
  };
export type AgentSessionLogData = {
  id: number;
  event_key: string;
  login_at: string;
  logout_at: string;
  booking_code: string | null;
};
export type AgentSessionLogDataRead = {
  id: number;
  event_key: string;
  login_at: string;
  logout_at: string;
  booking_code: string | null;
  access_type: ChoiceRead | null;
};
export type AgentSessionLogResponse = {
  data: AgentSessionLogData;
};
export type AgentSessionLogResponseRead = {
  data: AgentSessionLogDataRead;
};
export type AgentSessionLogReport = {
  /** Agent-generated id of this session; repeat it on retry. */
  event_key: string;
  login_at: string;
  logout_at: string;
  active_duration_seconds: number;
  remote_user: string;
  remote_ip?: string | null;
  remote_host?: string | null;
  /** Empty for a temp login (no booking). */
  booking_code?: string | null;
  agent_version?: string;
};
export type AadLoginResponse = {
  username: string;
  access: string;
  is_active: boolean;
  csrf_token?: string;
};
export type AadLoginSerializerAadLoginResponseDetailResponse = {
  data: AadLoginResponse;
};
export type AadLogin = {};
export type AadLoginWrite = {
  id_token: string;
  /** The browser's random secret; the ID token's nonce is base64url(SHA-256(nonce_secret)). */
  nonce_secret: string;
};
export type PaginationMeta = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type AgentListMeta = {
  pagination: PaginationMeta;
};
export type AgentListResponse = {
  data: AgentIdentity[];
  meta: AgentListMeta;
};
export type AgentListResponseRead = {
  data: AgentIdentityRead[];
  meta: AgentListMeta;
};
export type EnrollmentGrantIssued = {
  agent_uid: string;
  equipment_uid: string;
  grant: string;
  expires_at: string;
};
export type EnrollmentGrantIssuedResponse = {
  data: EnrollmentGrantIssued;
};
export type CreateAgentGrantRequest = {
  equipment_uid: string;
  ttl_minutes?: number;
};
export type UserReference = {};
export type UserReferenceRead = {
  id: number;
  username: string;
  display_name: string;
};
export type EnrollmentGrant = {
  id: number;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  created_by: UserReference | null;
};
export type EnrollmentGrantRead = {
  id: number;
  status: ChoiceRead;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  created_by: UserReferenceRead | null;
};
export type EnrollmentGrantListResponse = {
  data: EnrollmentGrant[];
  meta: AgentListMeta;
};
export type EnrollmentGrantListResponseRead = {
  data: EnrollmentGrantRead[];
  meta: AgentListMeta;
};
export type CreateGrantForAgentRequest = {
  ttl_minutes?: number;
};
export type EnrollmentGrantResponse = {
  data: EnrollmentGrant;
};
export type EnrollmentGrantResponseRead = {
  data: EnrollmentGrantRead;
};
export type CsrfTokenResponse = {
  csrf_token: string;
};
export type CsrfTokenSerializerCsrfTokenResponseDetailResponse = {
  data: CsrfTokenResponse;
};
export type BenchGroupSummary = {
  id: number;
  name: string;
  bench_group_name?: string;
  total_benches: number;
  active_benches: number;
  entries?: number;
};
export type BenchGroupSummarySerializersBenchGroupSummaryListResponse = {
  data: BenchGroupSummary[];
};
export type ReportPeriod = {
  starts_at: string;
  ends_at: string;
};
export type BookedVsUsedBench = {
  booked_hours: number;
};
export type BookedVsUsedBenchRead = {
  bench: LabsNamedReferenceRead;
  booked_hours: number;
};
export type BookedVsUsed = {
  period: ReportPeriod;
  total_booked_hours: number;
  total_used_hours: number;
  used_to_booked_ratio: number | null;
  official_working_hours: number;
  benches: BookedVsUsedBench[];
};
export type BookedVsUsedRead = {
  period: ReportPeriod;
  total_booked_hours: number;
  total_used_hours: number;
  used_to_booked_ratio: number | null;
  official_working_hours: number;
  benches: BookedVsUsedBenchRead[];
};
export type BookedVsUsedAnalyticsSerializersBookedVsUsedDetailResponse = {
  data: BookedVsUsed;
};
export type BookedVsUsedAnalyticsSerializersBookedVsUsedDetailResponseRead = {
  data: BookedVsUsedRead;
};
export type AnalyticsCountTrend = {
  count: number;
  trend: number;
};
export type AnalyticsAggregatedLog = {
  date?: string;
  year?: number;
  week?: number;
  month?: number;
  quarter?: number;
  count: number;
};
export type BookingCountAnalyticsResponsePayload =
  AnalyticsCountTrend | AnalyticsAggregatedLog[];
export type BookingCountAnalyticsResponse = {
  data: BookingCountAnalyticsResponsePayload;
};
export type EquipmentAvailabilityItem = {
  uptime_percent: number;
  unavailable_hours: number;
  outage_count: number;
  current_status: string;
};
export type EquipmentAvailabilityItemRead = {
  equipment: LabsNamedReferenceRead;
  uptime_percent: number;
  unavailable_hours: number;
  outage_count: number;
  current_status: string;
};
export type EquipmentAvailability = {
  period: ReportPeriod;
  equipment_count: number;
  average_uptime_percent: number | null;
  items: EquipmentAvailabilityItem[];
};
export type EquipmentAvailabilityRead = {
  period: ReportPeriod;
  equipment_count: number;
  average_uptime_percent: number | null;
  items: EquipmentAvailabilityItemRead[];
};
export type EquipmentAvailabilityAnalyticsSerializersEquipmentAvailabilityDetailResponse =
  {
    data: EquipmentAvailability;
  };
export type EquipmentAvailabilityAnalyticsSerializersEquipmentAvailabilityDetailResponseRead =
  {
    data: EquipmentAvailabilityRead;
  };
export type FinancePeriod = {
  /** Inclusive instant at local first-month midnight, represented in UTC. */
  starts_at: string;
  /** Exclusive instant at local midnight following end_month, represented in UTC. */
  ends_at: string;
};
export type FinanceMoney = {
  /** Exact decimal string, two source-stored decimal places. */
  amount: string;
  currency: string;
};
export type FinanceTotals = {
  payments: FinanceMoney;
  /** Negative cash-flow contribution of refunds. */
  refunds: FinanceMoney;
  /** Payments plus signed refunds; may be negative. */
  net: FinanceMoney;
  transaction_count: number;
};
export type FinanceSources = {
  expense: FinanceTotals;
  procurement: FinanceTotals;
};
export type FinanceBreakdownItem = {
  payments: FinanceMoney;
  /** Negative cash-flow contribution of refunds. */
  refunds: FinanceMoney;
  /** Payments plus signed refunds; may be negative. */
  net: FinanceMoney;
  transaction_count: number;
  /** Expense-owned type, or procurement for purchases with no expense type. */
  expense_type: string;
};
export type FinanceBreakdownItemRead = {
  payments: FinanceMoney;
  /** Negative cash-flow contribution of refunds. */
  refunds: FinanceMoney;
  /** Payments plus signed refunds; may be negative. */
  net: FinanceMoney;
  transaction_count: number;
  /** Expense-owned type, or procurement for purchases with no expense type. */
  expense_type: string;
  source: ChoiceRead;
};
export type FinanceBreakdown = {
  currency: string;
  start_month: string;
  end_month: string;
  timezone: string;
  period: FinancePeriod;
  combined: FinanceTotals;
  sources: FinanceSources;
  items: FinanceBreakdownItem[];
};
export type FinanceBreakdownRead = {
  currency: string;
  start_month: string;
  end_month: string;
  timezone: string;
  period: FinancePeriod;
  combined: FinanceTotals;
  sources: FinanceSources;
  items: FinanceBreakdownItemRead[];
};
export type FinanceBreakdownAnalyticsSerializersFinanceBreakdownDetailResponse =
  {
    data: FinanceBreakdown;
  };
export type FinanceBreakdownAnalyticsSerializersFinanceBreakdownDetailResponseRead =
  {
    data: FinanceBreakdownRead;
  };
export type FinanceProblemResponse = {
  error: ProblemDetail;
};
export type FinanceMonth = {
  month: string;
  combined: FinanceTotals;
  sources: FinanceSources;
};
export type FinanceMonthlyTrends = {
  currency: string;
  start_month: string;
  end_month: string;
  timezone: string;
  period: FinancePeriod;
  combined: FinanceTotals;
  sources: FinanceSources;
  /** Chronological series, zero-filled for every requested month. */
  months: FinanceMonth[];
};
export type FinanceMonthlyTrendsAnalyticsSerializersFinanceMonthlyTrendsDetailResponse =
  {
    data: FinanceMonthlyTrends;
  };
export type FinanceSummary = {
  currency: string;
  start_month: string;
  end_month: string;
  timezone: string;
  period: FinancePeriod;
  combined: FinanceTotals;
  sources: FinanceSources;
};
export type FinanceSummaryAnalyticsSerializersFinanceSummaryDetailResponse = {
  data: FinanceSummary;
};
export type LabCountAnalyticsResponsePayload =
  AnalyticsCountTrend | AnalyticsAggregatedLog[];
export type LabCountAnalyticsResponse = {
  data: LabCountAnalyticsResponsePayload;
};
export type LabEfficiency = {
  name: string;
  lab_name: string;
  computer_name: string;
  efficiency: number;
  duration: number;
  booking: number;
};
export type LabEfficiencySerializersLabEfficiencyListResponse = {
  data: LabEfficiency[];
};
export type EquipmentStatusSummary = {
  status: string;
  count: number;
  entries?: number;
};
export type EquipmentStatusSummarySerializersEquipmentStatusSummaryListResponse =
  {
    data: EquipmentStatusSummary[];
  };
export type LabUsageTimeframe = {
  timeslot: string;
  usage: number;
};
export type LabUsageTimeframeSerializersLabUsageTimeframeListResponse = {
  data: LabUsageTimeframe[];
};
export type LabVisitAnalyticsResponsePayload =
  AnalyticsCountTrend | AnalyticsAggregatedLog[];
export type LabVisitAnalyticsResponse = {
  data: LabVisitAnalyticsResponsePayload;
};
export type LabVisitLogResponse = {
  id?: number;
  facility_identifier?: string;
  occurred_at?: string;
};
export type LabVisitCreatedSerializersLabVisitLogResponseDetailResponse = {
  data: LabVisitLogResponse;
};
export type LabVisitLogCreate = {
  facility_identifier?: string;
  external_reference?: string;
};
export type ProjectUsage = {
  project_name: string;
  usage: number;
};
export type ProjectUsageSerializersProjectUsageListResponse = {
  data: ProjectUsage[];
};
export type StorageQuotaList = {
  username?: string;
  account_identifier: string;
  account_display_name?: string;
  computer_identifier?: string;
  used?: number;
  used_gibibytes: number;
  quota?: number;
  quota_gibibytes: number;
  utilization_percent: number;
  measured_at: string;
};
export type StorageQuotaListSerializersStorageQuotaListListResponse = {
  data: StorageQuotaList[];
};
export type StorageQuotaCreatedSerializersStorageQuotaListDetailResponse = {
  data: StorageQuotaList;
};
export type StorageQuotaCreate = {
  account_identifier?: string;
  username?: string;
  used_gibibytes?: string;
  used?: string;
  quota_gibibytes?: string;
  quota?: string;
  computer_identifier?: string;
  computer_sku?: string;
  account_display_name?: string;
  user_displayname?: string;
  source?: string;
};
export type UserBookingEfficiency = {
  remote_user: string;
  efficiency: number;
  remote_user_displayname?: string;
};
export type UserBookingEfficiencySerializersUserBookingEfficiencyListResponse =
  {
    data: UserBookingEfficiency[];
  };
export type UserCountAnalyticsResponsePayload =
  AnalyticsCountTrend | AnalyticsAggregatedLog[];
export type UserCountAnalyticsResponse = {
  data: UserCountAnalyticsResponsePayload;
};
export type UserLabUsage = {
  remote_user: string;
  usage: number;
  remote_user_displayname?: string;
};
export type UserLabUsageSerializersUserLabUsageListResponse = {
  data: UserLabUsage[];
};
export type AuditCatalogItem = {
  uid: string;
  sku: string;
  name: string;
  /** Equipment only; empty for other types. */
  serial_number: string;
  /** Equipment lifecycle_state; bench, station or room lifecycle_status; or the newest status record of a license; empty when none exists. */
  status: string;
  /** Computed from downtime (operational, in_maintenance, out_of_service); empty for licenses. */
  condition: string;
  /** Bench: setup station name. Station: room name. Room: building name. Otherwise empty. */
  location: string;
  /** License expiry; null for other types. */
  expires_at: string | null;
  updated_at: string;
  /** True when the resource was deleted; remove it from the local copy. */
  is_deleted: boolean;
};
export type AuditCatalogItemRead = {
  uid: string;
  resource_type: ChoiceRead;
  sku: string;
  name: string;
  /** Equipment only; empty for other types. */
  serial_number: string;
  /** Equipment lifecycle_state; bench, station or room lifecycle_status; or the newest status record of a license; empty when none exists. */
  status: string;
  /** Computed from downtime (operational, in_maintenance, out_of_service); empty for licenses. */
  condition: string;
  /** Bench: setup station name. Station: room name. Room: building name. Otherwise empty. */
  location: string;
  /** License expiry; null for other types. */
  expires_at: string | null;
  updated_at: string;
  /** True when the resource was deleted; remove it from the local copy. */
  is_deleted: boolean;
};
export type AuditCatalogPagination = {
  /** Always null: not computed for cursor pages. */
  count: number | null;
  page_size: number;
  next_cursor: string | null;
  /** Always null: the catalog pages forward only. */
  previous_cursor: string | null;
};
export type AuditCatalogMeta = {
  pagination: AuditCatalogPagination;
  /** Time the sync started. Store it and send it as changed_since on the next sync. */
  sync_started_at: string;
};
export type AuditCatalogResponse = {
  data: AuditCatalogItem[];
  meta: AuditCatalogMeta;
};
export type AuditCatalogResponseRead = {
  data: AuditCatalogItemRead[];
  meta: AuditCatalogMeta;
};
export type AllResourceAuditListSerializersResourceAuditItemPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type AllResourceAuditListSerializersResourceAuditItemPaginationMeta = {
  pagination: AllResourceAuditListSerializersResourceAuditItemPagination;
};
export type ResourceAuditItem = {
  remarks?: string;
  audited_at: string;
};
export type AuditedResource = {};
export type AuditedResourceTypeEnum =
  "equipment" | "bench" | "station" | "room" | "license";
export type AuditedResourceRead = {
  id: number;
  name: string;
  type: AuditedResourceTypeEnum;
};
export type ResourceAuditItemRead = {
  id: number;
  resource: AuditedResourceRead;
  auditor: UserReferenceRead;
  result: ChoiceRead;
  remarks?: string;
  audited_at: string;
  created_at: string;
};
export type AllResourceAuditListSerializersResourceAuditItemPaginatedResponse =
  {
    meta: AllResourceAuditListSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItem[];
  };
export type AllResourceAuditListSerializersResourceAuditItemPaginatedResponseRead =
  {
    meta: AllResourceAuditListSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItemRead[];
  };
export type ResourceAuditDetailSerializersResourceAuditItemDetailResponse = {
  data: ResourceAuditItem;
};
export type ResourceAuditDetailSerializersResourceAuditItemDetailResponseRead =
  {
    data: ResourceAuditItemRead;
  };
export type AuditResultInputEnum =
  "PASS" | "FAIL" | "NOT_ASSESSED" | "OK" | "NOK";
export type PatchedUpdateResourceAuditRequest = {
  result?: AuditResultInputEnum;
  remarks?: string;
  audited_at?: string | null;
};
export type BenchBookingListSerializersBenchBookingPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type BenchBookingListSerializersBenchBookingPaginationMeta = {
  pagination: BenchBookingListSerializersBenchBookingPagination;
};
export type BenchBooking = {};
export type LabsUidNamedReference = {};
export type LabsUidNamedReferenceRead = {
  id: number;
  uid: string;
  name: string;
};
export type LabsChoiceReference = {};
export type LabsChoiceReferenceRead = {
  value: string;
  label: string;
};
export type BenchBookingRead = {
  id: number;
  booking_code: string;
  creator: UserReferenceRead | null;
  bench: LabsUidNamedReferenceRead;
  starts_at: string;
  ends_at: string;
  status: LabsChoiceReferenceRead;
  approval_status: LabsChoiceReferenceRead;
  project: LabsNamedReferenceRead | null;
  reason: string;
  created_at: string;
  updated_at: string;
};
export type BenchBookingListSerializersBenchBookingPaginatedResponse = {
  meta: BenchBookingListSerializersBenchBookingPaginationMeta;
  data: BenchBooking[];
};
export type BenchBookingListSerializersBenchBookingPaginatedResponseRead = {
  meta: BenchBookingListSerializersBenchBookingPaginationMeta;
  data: BenchBookingRead[];
};
export type BenchBookingCreateSerializersBenchBookingDetailResponse = {
  data: BenchBooking;
};
export type BenchBookingCreateSerializersBenchBookingDetailResponseRead = {
  data: BenchBookingRead;
};
export type BenchBookingCreate = {
  bench_id: number;
  starts_at: string;
  ends_at: string;
  reason: string;
  project_id: number;
};
export type BenchBookingDetailSerializersBenchBookingDetailResponse = {
  data: BenchBooking;
};
export type BenchBookingDetailSerializersBenchBookingDetailResponseRead = {
  data: BenchBookingRead;
};
export type BenchBookingUpdateSerializersBenchBookingDetailResponse = {
  data: BenchBooking;
};
export type BenchBookingUpdateSerializersBenchBookingDetailResponseRead = {
  data: BenchBookingRead;
};
export type PatchedBenchBookingUpdate = {
  bench_id?: number;
  starts_at?: string;
  ends_at?: string;
  reason?: string;
  project_id?: number | null;
};
export type PatchedBenchBookingUpdateRead = {
  bench_id?: number;
  starts_at?: string;
  ends_at?: string;
  reason?: string;
  project_id?: number | null;
  status?: string;
};
export type BenchBookingApproveActionSerializersBenchBookingDetailResponse = {
  data: BenchBooking;
};
export type BenchBookingApproveActionSerializersBenchBookingDetailResponseRead =
  {
    data: BenchBookingRead;
  };
export type BenchBookingCancelActionSerializersBenchBookingDetailResponse = {
  data: BenchBooking;
};
export type BenchBookingCancelActionSerializersBenchBookingDetailResponseRead =
  {
    data: BenchBookingRead;
  };
export type BenchBookingCancelAction = {
  reason?: string;
};
export type BenchBookingCompleteActionSerializersBenchBookingDetailResponse = {
  data: BenchBooking;
};
export type BenchBookingCompleteActionSerializersBenchBookingDetailResponseRead =
  {
    data: BenchBookingRead;
  };
export type BenchBookingRejectActionSerializersBenchBookingDetailResponse = {
  data: BenchBooking;
};
export type BenchBookingRejectActionSerializersBenchBookingDetailResponseRead =
  {
    data: BenchBookingRead;
  };
export type BenchBookingRejectAction = {
  reason: string;
};
export type BenchBookingDetailByCodeSerializersBenchBookingDetailResponse = {
  data: BenchBooking;
};
export type BenchBookingDetailByCodeSerializersBenchBookingDetailResponseRead =
  {
    data: BenchBookingRead;
  };
export type BenchBookingUpdateByCodeSerializersBenchBookingDetailResponse = {
  data: BenchBooking;
};
export type BenchBookingUpdateByCodeSerializersBenchBookingDetailResponseRead =
  {
    data: BenchBookingRead;
  };
export type BenchBookingCancelByCodeActionSerializersBenchBookingDetailResponse =
  {
    data: BenchBooking;
  };
export type BenchBookingCancelByCodeActionSerializersBenchBookingDetailResponseRead =
  {
    data: BenchBookingRead;
  };
export type LabProjectReferenceListSerializersLabProjectCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type LabProjectReferenceListSerializersLabProjectCatalogRecordPaginationMeta =
  {
    pagination: LabProjectReferenceListSerializersLabProjectCatalogRecordPagination;
  };
export type LabProjectCatalogRecord = {};
export type LabProjectCatalogRecordRead = {
  id: number;
  project_name: string;
  /** Short unique project code, e.g. a cost-center number. */
  code: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};
export type LabProjectReferenceListSerializersLabProjectCatalogRecordPaginatedResponse =
  {
    meta: LabProjectReferenceListSerializersLabProjectCatalogRecordPaginationMeta;
    data: LabProjectCatalogRecord[];
  };
export type LabProjectReferenceListSerializersLabProjectCatalogRecordPaginatedResponseRead =
  {
    meta: LabProjectReferenceListSerializersLabProjectCatalogRecordPaginationMeta;
    data: LabProjectCatalogRecordRead[];
  };
export type LabProjectReferenceCreateSerializersLabProjectCatalogRecordDetailResponse =
  {
    data: LabProjectCatalogRecord;
  };
export type LabProjectReferenceCreateSerializersLabProjectCatalogRecordDetailResponseRead =
  {
    data: LabProjectCatalogRecordRead;
  };
export type LabProjectCatalogCreate = {
  project_name: string;
  /** Short unique project code, e.g. a cost-center number. */
  code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
};
export type LabProjectReferenceDetailSerializersLabProjectCatalogRecordDetailResponse =
  {
    data: LabProjectCatalogRecord;
  };
export type LabProjectReferenceDetailSerializersLabProjectCatalogRecordDetailResponseRead =
  {
    data: LabProjectCatalogRecordRead;
  };
export type BenchReferenceListSerializersBenchReferenceDataPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type BenchReferenceListSerializersBenchReferenceDataPaginationMeta = {
  pagination: BenchReferenceListSerializersBenchReferenceDataPagination;
};
export type BenchReferenceData = {};
export type BenchType = {};
export type BenchTypeRead = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type BenchGroup = {};
export type BenchGroupRead = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type BenchStationReference = {};
export type BenchStationReferenceRead = {
  id: number;
  uid: string;
  sku: string;
  name: string;
};
export type BenchReferenceDataRead = {
  types: BenchTypeRead[];
  groups: BenchGroupRead[];
  stations: BenchStationReferenceRead[];
  lifecycle_statuses: LabsChoiceReferenceRead[];
  /** Deprecated four-value status. */
  statuses: LabsChoiceReferenceRead[];
};
export type BenchReferenceListSerializersBenchReferenceDataPaginatedResponse = {
  meta: BenchReferenceListSerializersBenchReferenceDataPaginationMeta;
  data: BenchReferenceData[];
};
export type BenchReferenceListSerializersBenchReferenceDataPaginatedResponseRead =
  {
    meta: BenchReferenceListSerializersBenchReferenceDataPaginationMeta;
    data: BenchReferenceDataRead[];
  };
export type BenchGroupCreateSerializersBenchGroupDetailResponse = {
  data: BenchGroup;
};
export type BenchGroupCreateSerializersBenchGroupDetailResponseRead = {
  data: BenchGroupRead;
};
export type BenchReferenceWrite = {
  name: string;
  description?: string;
  is_active?: boolean;
};
export type BenchGroupDetailSerializersBenchGroupDetailResponse = {
  data: BenchGroup;
};
export type BenchGroupDetailSerializersBenchGroupDetailResponseRead = {
  data: BenchGroupRead;
};
export type BenchGroupUpdateSerializersBenchGroupDetailResponse = {
  data: BenchGroup;
};
export type BenchGroupUpdateSerializersBenchGroupDetailResponseRead = {
  data: BenchGroupRead;
};
export type PatchedBenchReferenceWrite = {
  name?: string;
  description?: string;
  is_active?: boolean;
};
export type CatalogOptionList = {};
export type CatalogOption = {};
export type CatalogOptionRead = {
  id: number;
  sku: string | null;
  name: string;
};
export type CatalogOptionListRead = {
  data: CatalogOptionRead[];
};
export type BenchTypeCreateSerializersBenchTypeDetailResponse = {
  data: BenchType;
};
export type BenchTypeCreateSerializersBenchTypeDetailResponseRead = {
  data: BenchTypeRead;
};
export type BenchTypeDetailSerializersBenchTypeDetailResponse = {
  data: BenchType;
};
export type BenchTypeDetailSerializersBenchTypeDetailResponseRead = {
  data: BenchTypeRead;
};
export type BenchTypeUpdateSerializersBenchTypeDetailResponse = {
  data: BenchType;
};
export type BenchTypeUpdateSerializersBenchTypeDetailResponseRead = {
  data: BenchTypeRead;
};
export type BenchListSerializersBenchPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type BenchListSerializersBenchPaginationMeta = {
  pagination: BenchListSerializersBenchPagination;
};
export type Bench = {};
export type LabsBenchRoomReference = {};
export type LabsBenchRoomReferenceRead = {
  id: number;
  uid: string;
  name: string;
  sku: string;
};
export type LabsAvailability = {};
export type LabsAvailabilitySource = {};
export type LabsAvailabilitySourceTypeEnum = "bench" | "station" | "room";
export type LabsAvailabilitySourceRead = {
  id: number;
  name: string;
  type: LabsAvailabilitySourceTypeEnum;
};
export type LabsAvailabilityRead = {
  status: ChoiceRead;
  /** The resource that blocks. */
  blocked_by: LabsAvailabilitySourceRead | null;
  condition: ChoiceRead | null;
  /** Lifecycle status, or the downtime reason, of blocked_by. */
  reason: ChoiceRead | null;
};
export type BenchRead = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  group: LabsNamedReferenceRead | null;
  department: LabsNamedReferenceRead | null;
  owner: UserReferenceRead | null;
  remark: string;
  image_url: string | null;
  type: LabsNamedReferenceRead | null;
  bench_group: LabsNamedReferenceRead | null;
  description: string;
  documentation_url: string;
  setup_location: LabsUidNamedReferenceRead | null;
  station_slot: LabsNamedReferenceRead | null;
  /** Room of the station the bench is set up on; null when the bench is unplaced or the station has no room. */
  room: LabsBenchRoomReferenceRead | null;
  /** Deprecated: use lifecycle_status, condition, availability and activity_status. */
  status: LabsChoiceReferenceRead | null;
  lifecycle_status: LabsChoiceReferenceRead;
  condition: LabsChoiceReferenceRead;
  availability: LabsAvailabilityRead;
  activity_status: LabsChoiceReferenceRead;
  criticality: string;
  requested_power_w: number | null;
  requested_load_kg: number | null;
  requested_cooling_w: number | null;
  required_utilities: any;
  commissioning_date: string | null;
  last_inspected_at: string | null;
  next_inspection_due_at: string | null;
  created_at: string;
  updated_at: string;
  setup_location_path: string;
  is_favorite: boolean;
  equipment_count: number;
  equipment_url: string;
};
export type BenchListSerializersBenchPaginatedResponse = {
  meta: BenchListSerializersBenchPaginationMeta;
  data: Bench[];
};
export type BenchListSerializersBenchPaginatedResponseRead = {
  meta: BenchListSerializersBenchPaginationMeta;
  data: BenchRead[];
};
export type BenchCreateSerializersBenchDetailResponse = {
  data: Bench;
};
export type BenchCreateSerializersBenchDetailResponseRead = {
  data: BenchRead;
};
export type BenchCreate = {
  sku: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  type_id?: number | null;
  bench_group_id?: number | null;
  description?: string;
  documentation_url?: string;
  setup_location_id?: number | null;
  station_slot_id?: number | null;
  criticality?: string;
  requested_power_w?: number | null;
  requested_load_kg?: number | null;
  requested_cooling_w?: number | null;
  required_utilities?: {
    [key: string]: any;
  };
  commissioning_date?: string | null;
  last_inspected_at?: string | null;
  next_inspection_due_at?: string | null;
};
export type BenchResourceDetail = {};
export type BenchResourceDetailRead = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  group: LabsNamedReferenceRead | null;
  department: LabsNamedReferenceRead | null;
  owner: UserReferenceRead | null;
  remark: string;
  image_url: string | null;
  type: LabsNamedReferenceRead | null;
  bench_group: LabsNamedReferenceRead | null;
  description: string;
  documentation_url: string;
  setup_location: LabsUidNamedReferenceRead | null;
  station_slot: LabsNamedReferenceRead | null;
  /** Room of the station the bench is set up on; null when the bench is unplaced or the station has no room. */
  room: LabsBenchRoomReferenceRead | null;
  /** Deprecated: use lifecycle_status, condition, availability and activity_status. */
  status: LabsChoiceReferenceRead | null;
  lifecycle_status: LabsChoiceReferenceRead;
  condition: LabsChoiceReferenceRead;
  availability: LabsAvailabilityRead;
  activity_status: LabsChoiceReferenceRead;
  criticality: string;
  requested_power_w: number | null;
  requested_load_kg: number | null;
  requested_cooling_w: number | null;
  required_utilities: any;
  commissioning_date: string | null;
  last_inspected_at: string | null;
  next_inspection_due_at: string | null;
  created_at: string;
  updated_at: string;
  setup_location_path: string;
  is_favorite: boolean;
  equipment_count: number;
  equipment_url: string;
};
export type BenchDetailSerializersBenchResourceDetailDetailResponse = {
  data: BenchResourceDetail;
};
export type BenchDetailSerializersBenchResourceDetailDetailResponseRead = {
  data: BenchResourceDetailRead;
};
export type BenchReplaceSerializersBenchDetailResponse = {
  data: Bench;
};
export type BenchReplaceSerializersBenchDetailResponseRead = {
  data: BenchRead;
};
export type BenchUpdate = {
  sku: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  type_id?: number | null;
  bench_group_id?: number | null;
  description?: string;
  documentation_url?: string;
  setup_location_id?: number | null;
  station_slot_id?: number | null;
  criticality?: string;
  requested_power_w?: number | null;
  requested_load_kg?: number | null;
  requested_cooling_w?: number | null;
  required_utilities?: {
    [key: string]: any;
  };
  commissioning_date?: string | null;
  last_inspected_at?: string | null;
  next_inspection_due_at?: string | null;
};
export type BenchUpdateSerializersBenchDetailResponse = {
  data: Bench;
};
export type BenchUpdateSerializersBenchDetailResponseRead = {
  data: BenchRead;
};
export type PatchedBenchUpdate = {
  sku?: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  type_id?: number | null;
  bench_group_id?: number | null;
  description?: string;
  documentation_url?: string;
  setup_location_id?: number | null;
  station_slot_id?: number | null;
  criticality?: string;
  requested_power_w?: number | null;
  requested_load_kg?: number | null;
  requested_cooling_w?: number | null;
  required_utilities?: {
    [key: string]: any;
  };
  commissioning_date?: string | null;
  last_inspected_at?: string | null;
  next_inspection_due_at?: string | null;
};
export type BenchLifecycleChangeSerializersBenchDetailResponse = {
  data: Bench;
};
export type BenchLifecycleChangeSerializersBenchDetailResponseRead = {
  data: BenchRead;
};
export type LifecycleStatusEnum = "planned" | "in_service" | "retired";
export type BenchLifecycleWrite = {
  lifecycle_status: LifecycleStatusEnum;
};
export type BenchFavorite = {};
export type BenchFavoriteRead = {
  id: number;
  bench: LabsUidNamedReferenceRead;
  created_at: string;
};
export type BenchFavoriteSerializersBenchFavoriteDetailResponse = {
  data: BenchFavorite;
};
export type BenchFavoriteSerializersBenchFavoriteDetailResponseRead = {
  data: BenchFavoriteRead;
};
export type BenchPlaceActionSerializersBenchDetailResponse = {
  data: Bench;
};
export type BenchPlaceActionSerializersBenchDetailResponseRead = {
  data: BenchRead;
};
export type BenchPlacement = {
  setup_location_id?: number | null;
  station_slot_id?: number | null;
};
export type BenchPlacementSerializersBenchDetailResponse = {
  data: Bench;
};
export type BenchPlacementSerializersBenchDetailResponseRead = {
  data: BenchRead;
};
export type PatchedBenchPlacement = {
  setup_location_id?: number | null;
  station_slot_id?: number | null;
};
export type BenchEquipmentListSerializersBenchSetupEquipmentPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type BenchEquipmentListSerializersBenchSetupEquipmentPaginationMeta = {
  pagination: BenchEquipmentListSerializersBenchSetupEquipmentPagination;
};
export type BenchSetupEquipment = {};
export type BenchSetupEquipmentRead = {
  id: number;
  equipment: LabsUidNamedReferenceRead;
  equipment_kind: LabsNamedReferenceRead | null;
  role: string;
  position: number;
  is_monitored: boolean;
  assigned_at: string;
};
export type BenchEquipmentListSerializersBenchSetupEquipmentPaginatedResponse =
  {
    meta: BenchEquipmentListSerializersBenchSetupEquipmentPaginationMeta;
    data: BenchSetupEquipment[];
  };
export type BenchEquipmentListSerializersBenchSetupEquipmentPaginatedResponseRead =
  {
    meta: BenchEquipmentListSerializersBenchSetupEquipmentPaginationMeta;
    data: BenchSetupEquipmentRead[];
  };
export type ResourceImage = {};
export type ResourceImageRead = {
  image_url: string | null;
};
export type ResourceImageResourceImagesResourceImageDetailResponse = {
  data: ResourceImage;
};
export type ResourceImageResourceImagesResourceImageDetailResponseRead = {
  data: ResourceImageRead;
};
export type ResourceImageUpload = {
  /** JPEG, PNG, GIF or WebP, at most 5 MB. The type is detected from the content. */
  file: Blob;
};
export type LabProfile = {
  id: number;
  name: string;
  sku?: string;
  total_sessions: number;
  active_users: number;
  top_projects?: string[];
};
export type LabProfileSerializersLabProfileDetailResponse = {
  data: LabProfile;
};
export type WeeklyUsageSlot = {
  day: number;
  hour: number;
  usage: number;
};
export type LabWeeklyUsageSerializersWeeklyUsageSlotListResponse = {
  data: WeeklyUsageSlot[];
};
export type MappingRoom = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  layout_rows: number | null;
  layout_columns: number | null;
};
export type MappingRoomSlot = {
  id: number;
  room_id: number;
  row_index: number;
  col_index: number;
  slot_code: string;
  x_mm: number | null;
  y_mm: number | null;
  width_mm: number | null;
  depth_mm: number | null;
  orientation_degrees: number;
};
export type MappingStation = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  room_id: number | null;
  slot_id: number | null;
};
export type MappingStationSlot = {
  id: number;
  station_id: number;
  position_index: number;
  slot_code: string;
  label: string;
};
export type MappingBench = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  setup_location_id: number | null;
  station_slot_id: number | null;
};
export type MappingEquipmentCategory = {
  id: number;
  name: string;
};
export type MappingEquipmentAssignment = {
  id: number;
  role: string;
  position: number;
  is_monitored: boolean;
  assigned_at: string;
};
export type MappingEquipment = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  category: MappingEquipmentCategory | null;
  bench_id: number | null;
  bench_assignment: MappingEquipmentAssignment | null;
};
export type MappingLicenseCategory = {
  id: number;
  name: string | null;
};
export type MappingLicense = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  category: MappingLicenseCategory | null;
};
export type MappingLicenseAssignment = {
  id: number;
  equipment_id: number;
  license_id: number;
  assigned_at: string;
};
export type ResourceMappingData = {
  rooms: MappingRoom[];
  room_slots: MappingRoomSlot[];
  stations: MappingStation[];
  station_slots: MappingStationSlot[];
  benches: MappingBench[];
  equipment: MappingEquipment[];
  licenses: MappingLicense[];
  license_assignments: MappingLicenseAssignment[];
};
export type MappingPagination = {
  count: number;
  page_size: number;
  next_cursor: string | null;
  previous_cursor: string | null;
};
export type ResourceMappingPagination = {
  rooms: MappingPagination;
  room_slots: MappingPagination;
  stations: MappingPagination;
  station_slots: MappingPagination;
  benches: MappingPagination;
  equipment: MappingPagination;
  licenses: MappingPagination;
  license_assignments: MappingPagination;
};
export type ResourceMappingMeta = {
  pagination: ResourceMappingPagination;
};
export type ResourceMappingResponse = {
  data: ResourceMappingData;
  meta: ResourceMappingMeta;
};
export type BookingBenchChoices = {};
export type BookingBenchChoice = {};
export type BenchComputer = {};
export type BenchComputerRead = {
  id: number;
  sku: string;
  name: string;
  /** Empty when not reported yet. */
  hostname: string;
};
export type BookingBenchChoiceRead = {
  id: number;
  sku: string;
  name: string;
  /** Computers on the bench now. */
  computers: BenchComputerRead[];
};
export type BookingBenchChoicesRead = {
  data: BookingBenchChoiceRead[];
};
export type FilterMetadata = {
  filters: {
    [key: string]: any;
  }[];
  combination: string;
  multi_value_combination: string;
  separator: string;
  search: {
    [key: string]: any;
  } | null;
  ordering: string[];
  default_ordering: string[];
};
export type BenchFiltersFilteringFilterMetadataDetailResponse = {
  data: FilterMetadata;
};
export type BenchReferenceDataSerializersBenchReferenceDataDetailResponse = {
  data: BenchReferenceData;
};
export type BenchReferenceDataSerializersBenchReferenceDataDetailResponseRead =
  {
    data: BenchReferenceDataRead;
  };
export type BenchGroupReferenceListSerializersBenchGroupCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type BenchGroupReferenceListSerializersBenchGroupCatalogRecordPaginationMeta =
  {
    pagination: BenchGroupReferenceListSerializersBenchGroupCatalogRecordPagination;
  };
export type BenchGroupCatalogRecord = {};
export type BenchGroupCatalogRecordRead = {
  id: number;
  name: string;
  is_active: boolean;
};
export type BenchGroupReferenceListSerializersBenchGroupCatalogRecordPaginatedResponse =
  {
    meta: BenchGroupReferenceListSerializersBenchGroupCatalogRecordPaginationMeta;
    data: BenchGroupCatalogRecord[];
  };
export type BenchGroupReferenceListSerializersBenchGroupCatalogRecordPaginatedResponseRead =
  {
    meta: BenchGroupReferenceListSerializersBenchGroupCatalogRecordPaginationMeta;
    data: BenchGroupCatalogRecordRead[];
  };
export type BenchGroupReferenceCreateSerializersBenchGroupCatalogRecordDetailResponse =
  {
    data: BenchGroupCatalogRecord;
  };
export type BenchGroupReferenceCreateSerializersBenchGroupCatalogRecordDetailResponseRead =
  {
    data: BenchGroupCatalogRecordRead;
  };
export type BenchGroupCatalogCreate = {
  name: string;
  is_active?: boolean;
};
export type BenchGroupReferenceDetailSerializersBenchGroupCatalogRecordDetailResponse =
  {
    data: BenchGroupCatalogRecord;
  };
export type BenchGroupReferenceDetailSerializersBenchGroupCatalogRecordDetailResponseRead =
  {
    data: BenchGroupCatalogRecordRead;
  };
export type BenchTypeReferenceListSerializersBenchTypeCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type BenchTypeReferenceListSerializersBenchTypeCatalogRecordPaginationMeta =
  {
    pagination: BenchTypeReferenceListSerializersBenchTypeCatalogRecordPagination;
  };
export type BenchTypeCatalogRecord = {};
export type BenchTypeCatalogRecordRead = {
  id: number;
  name: string;
  is_active: boolean;
};
export type BenchTypeReferenceListSerializersBenchTypeCatalogRecordPaginatedResponse =
  {
    meta: BenchTypeReferenceListSerializersBenchTypeCatalogRecordPaginationMeta;
    data: BenchTypeCatalogRecord[];
  };
export type BenchTypeReferenceListSerializersBenchTypeCatalogRecordPaginatedResponseRead =
  {
    meta: BenchTypeReferenceListSerializersBenchTypeCatalogRecordPaginationMeta;
    data: BenchTypeCatalogRecordRead[];
  };
export type BenchTypeReferenceCreateSerializersBenchTypeCatalogRecordDetailResponse =
  {
    data: BenchTypeCatalogRecord;
  };
export type BenchTypeReferenceCreateSerializersBenchTypeCatalogRecordDetailResponseRead =
  {
    data: BenchTypeCatalogRecordRead;
  };
export type BenchTypeCatalogCreate = {
  name: string;
  is_active?: boolean;
};
export type BenchTypeReferenceDetailSerializersBenchTypeCatalogRecordDetailResponse =
  {
    data: BenchTypeCatalogRecord;
  };
export type BenchTypeReferenceDetailSerializersBenchTypeCatalogRecordDetailResponseRead =
  {
    data: BenchTypeCatalogRecordRead;
  };
export type SummaryStatus = {
  value: string;
  label: string;
};
export type SummaryStatusCount = {
  status: SummaryStatus;
  resource_count: number;
};
export type BenchStatusSummary = {
  total_count: number;
  /** Resources without a recorded status or with an unrecognized status. */
  unknown_status_count: number;
  /** All code-defined states, including zero counts. Values are extensible. */
  statuses: SummaryStatusCount[];
};
export type BenchStatusSummaryDataSerializersBenchStatusSummaryDetailResponse =
  {
    data: BenchStatusSummary;
  };
export type BuildingCatalogListGeoSerializersBuildingPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type BuildingCatalogListGeoSerializersBuildingPaginationMeta = {
  pagination: BuildingCatalogListGeoSerializersBuildingPagination;
};
export type BuildingCatalogItem = {
  name: string;
  address?: string;
};
export type BuildingCatalogItemRead = {
  id: number;
  name: string;
  address?: string;
  city: LabsNamedReferenceRead | null;
};
export type BuildingCatalogItemWrite = {
  name: string;
  address?: string;
  city_id?: number;
};
export type BuildingCatalogListGeoSerializersBuildingPaginatedResponse = {
  meta: BuildingCatalogListGeoSerializersBuildingPaginationMeta;
  data: BuildingCatalogItem[];
};
export type BuildingCatalogListGeoSerializersBuildingPaginatedResponseRead = {
  meta: BuildingCatalogListGeoSerializersBuildingPaginationMeta;
  data: BuildingCatalogItemRead[];
};
export type BuildingCatalogListGeoSerializersBuildingPaginatedResponseWrite = {
  meta: BuildingCatalogListGeoSerializersBuildingPaginationMeta;
  data: BuildingCatalogItemWrite[];
};
export type BuildingCatalogDetailGeoSerializersBuildingDetailResponse = {
  data: BuildingCatalogItem;
};
export type BuildingCatalogDetailGeoSerializersBuildingDetailResponseRead = {
  data: BuildingCatalogItemRead;
};
export type BuildingCatalogDetailGeoSerializersBuildingDetailResponseWrite = {
  data: BuildingCatalogItemWrite;
};
export type CityCatalogListGeoSerializersCityPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type CityCatalogListGeoSerializersCityPaginationMeta = {
  pagination: CityCatalogListGeoSerializersCityPagination;
};
export type CityCatalogItem = {
  name: string;
};
export type CityCatalogItemRead = {
  id: number;
  name: string;
  country: LabsNamedReferenceRead | null;
};
export type CityCatalogItemWrite = {
  name: string;
  country_id?: number;
};
export type CityCatalogListGeoSerializersCityPaginatedResponse = {
  meta: CityCatalogListGeoSerializersCityPaginationMeta;
  data: CityCatalogItem[];
};
export type CityCatalogListGeoSerializersCityPaginatedResponseRead = {
  meta: CityCatalogListGeoSerializersCityPaginationMeta;
  data: CityCatalogItemRead[];
};
export type CityCatalogListGeoSerializersCityPaginatedResponseWrite = {
  meta: CityCatalogListGeoSerializersCityPaginationMeta;
  data: CityCatalogItemWrite[];
};
export type CityCatalogDetailGeoSerializersCityDetailResponse = {
  data: CityCatalogItem;
};
export type CityCatalogDetailGeoSerializersCityDetailResponseRead = {
  data: CityCatalogItemRead;
};
export type CityCatalogDetailGeoSerializersCityDetailResponseWrite = {
  data: CityCatalogItemWrite;
};
export type CountryCatalogListGeoSerializersCountryPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type CountryCatalogListGeoSerializersCountryPaginationMeta = {
  pagination: CountryCatalogListGeoSerializersCountryPagination;
};
export type CountryCatalogItem = {
  code: string;
  name: string;
};
export type CountryCatalogItemRead = {
  id: number;
  code: string;
  name: string;
};
export type CountryCatalogListGeoSerializersCountryPaginatedResponse = {
  meta: CountryCatalogListGeoSerializersCountryPaginationMeta;
  data: CountryCatalogItem[];
};
export type CountryCatalogListGeoSerializersCountryPaginatedResponseRead = {
  meta: CountryCatalogListGeoSerializersCountryPaginationMeta;
  data: CountryCatalogItemRead[];
};
export type CountryCatalogDetailGeoSerializersCountryDetailResponse = {
  data: CountryCatalogItem;
};
export type CountryCatalogDetailGeoSerializersCountryDetailResponseRead = {
  data: CountryCatalogItemRead;
};
export type DashboardBenchListSerializersDashboardBenchPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type DashboardBenchListSerializersDashboardBenchPaginationMeta = {
  pagination: DashboardBenchListSerializersDashboardBenchPagination;
};
export type DashboardBenchGroup = {
  id: number;
  name: string;
};
export type DashboardBenchType = {
  id: number;
  name: string;
};
export type DashboardLocation = {
  station: LabsNamedReference | null;
  room: LabsNamedReference | null;
  building: LabsNamedReference | null;
  slot_label: string | null;
};
export type DashboardLocationRead = {
  station: LabsNamedReferenceRead | null;
  room: LabsNamedReferenceRead | null;
  building: LabsNamedReferenceRead | null;
  slot_label: string | null;
};
export type DashboardUser = {
  id: number;
  username: string;
  display_name: string;
};
export type DashboardBooking = {
  id: number;
  booking_code: string;
  starts_at: string;
  ends_at: string;
  status: string;
  user: DashboardUser | null;
};
export type DashboardComputing = {
  id: number;
  sku?: string;
  name?: string;
  ip_address: string | null;
  os_name: string;
  rdp_file_url: string | null;
  activity_status: string;
  remote_user: string;
  remote_user_display_name: string;
  remote_ip: string | null;
};
export type DashboardEquipmentReference = {
  id: number;
  sku?: string;
  name?: string;
};
export type DashboardBench = {
  id: number;
  sku: string;
  name: string;
  lifecycle_status: string;
  bench_group: DashboardBenchGroup | null;
  bench_type: DashboardBenchType | null;
  location: DashboardLocation | null;
  is_favorite?: boolean;
  current_booking: DashboardBooking | null;
  computing: DashboardComputing | null;
  samples: DashboardEquipmentReference[];
  licenses: DashboardEquipmentReference[];
  assigned_equipment_count: number;
  image_url: string | null;
  updated_at: string;
};
export type DashboardBenchRead = {
  id: number;
  sku: string;
  name: string;
  lifecycle_status: string;
  bench_group: DashboardBenchGroup | null;
  bench_type: DashboardBenchType | null;
  location: DashboardLocationRead | null;
  is_favorite?: boolean;
  current_booking: DashboardBooking | null;
  computing: DashboardComputing | null;
  samples: DashboardEquipmentReference[];
  licenses: DashboardEquipmentReference[];
  assigned_equipment_count: number;
  image_url: string | null;
  updated_at: string;
};
export type DashboardBenchListSerializersDashboardBenchPaginatedResponse = {
  meta: DashboardBenchListSerializersDashboardBenchPaginationMeta;
  data: DashboardBench[];
};
export type DashboardBenchListSerializersDashboardBenchPaginatedResponseRead = {
  meta: DashboardBenchListSerializersDashboardBenchPaginationMeta;
  data: DashboardBenchRead[];
};
export type DashboardBookingDetail = {
  id: number;
  booking_code: string;
  starts_at: string;
  ends_at: string;
  status: string;
};
export type DashboardComputingDetail = {
  id: number;
  sku?: string;
  name?: string;
  activity_status: string;
  last_agent_report_at: string | null;
  is_stale: boolean | null;
};
export type DashboardEquipmentItem = {
  id: number;
  sku: string;
  name: string;
  role: string;
  position: number;
  assigned_at: string;
  licenses: DashboardEquipmentReference[];
};
export type DashboardEquipmentCategoryReference = {
  id: number;
  name: string;
};
export type DashboardEquipmentActivity = {
  status: string;
  last_agent_report_at: string | null;
  is_stale: boolean | null;
};
export type DashboardEquipmentItemRead = {
  id: number;
  sku: string;
  name: string;
  category: DashboardEquipmentCategoryReference | null;
  role: string;
  position: number;
  assigned_at: string;
  computing_activity: DashboardEquipmentActivity | null;
  licenses: DashboardEquipmentReference[];
};
export type DashboardEquipmentCategoryGroup = {
  id: number | null;
  name: string;
  equipment: DashboardEquipmentItem[];
};
export type DashboardEquipmentCategoryGroupRead = {
  id: number | null;
  name: string;
  equipment: DashboardEquipmentItemRead[];
};
export type DashboardBenchDetail = {
  id: number;
  sku: string;
  name: string;
  lifecycle_status: string;
  bench_group: DashboardBenchGroup | null;
  bench_type: DashboardBenchType | null;
  location: DashboardLocation | null;
  is_favorite?: boolean;
  current_booking: DashboardBookingDetail | null;
  computing: DashboardComputingDetail | null;
  samples: DashboardEquipmentReference[];
  licenses: DashboardEquipmentReference[];
  assigned_equipment_count: number;
  image_url: string | null;
  updated_at: string;
  description?: string;
  documentation_url?: string;
  criticality?: string;
  equipment_by_category: DashboardEquipmentCategoryGroup[];
  upcoming_bookings: DashboardBookingDetail[];
};
export type DashboardBenchDetailRead = {
  id: number;
  sku: string;
  name: string;
  lifecycle_status: string;
  bench_group: DashboardBenchGroup | null;
  bench_type: DashboardBenchType | null;
  location: DashboardLocationRead | null;
  is_favorite?: boolean;
  current_booking: DashboardBookingDetail | null;
  computing: DashboardComputingDetail | null;
  samples: DashboardEquipmentReference[];
  licenses: DashboardEquipmentReference[];
  assigned_equipment_count: number;
  image_url: string | null;
  updated_at: string;
  description?: string;
  documentation_url?: string;
  criticality?: string;
  equipment_by_category: DashboardEquipmentCategoryGroupRead[];
  upcoming_bookings: DashboardBookingDetail[];
};
export type DashboardBenchDetailDataSerializersDashboardBenchDetailDetailResponse =
  {
    data: DashboardBenchDetail;
  };
export type DashboardBenchDetailDataSerializersDashboardBenchDetailDetailResponseRead =
  {
    data: DashboardBenchDetailRead;
  };
export type DashboardOperationalSummary = {
  /** Total number of active, non-deleted laboratory benches. */
  total_benches: number;
  /** Total number of currently active bench bookings. */
  active_bookings_count: number;
  /** Number of benches favorited by the current user. */
  favorited_benches_count: number;
  /** Breakdown of bench counts by lifecycle status. */
  lifecycle_distribution: {
    [key: string]: number;
  };
  /** Breakdown of computing equipment counts by operational activity status. */
  activity_distribution: {
    [key: string]: number;
  };
  /** Percentage of benches currently reserved or in-progress. */
  utilization_rate: number;
};
export type DashboardOperationalSummaryDataSerializersDashboardOperationalSummaryDetailResponse =
  {
    data: DashboardOperationalSummary;
  };
export type DepartmentCatalogListSerializersDepartmentPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type DepartmentCatalogListSerializersDepartmentPaginationMeta = {
  pagination: DepartmentCatalogListSerializersDepartmentPagination;
};
export type DepartmentCatalogItem = {
  name: string;
  is_active?: boolean;
};
export type DepartmentCatalogItemRead = {
  id: number;
  name: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};
export type DepartmentCatalogListSerializersDepartmentPaginatedResponse = {
  meta: DepartmentCatalogListSerializersDepartmentPaginationMeta;
  data: DepartmentCatalogItem[];
};
export type DepartmentCatalogListSerializersDepartmentPaginatedResponseRead = {
  meta: DepartmentCatalogListSerializersDepartmentPaginationMeta;
  data: DepartmentCatalogItemRead[];
};
export type DepartmentCatalogDetailSerializersDepartmentDetailResponse = {
  data: DepartmentCatalogItem;
};
export type DepartmentCatalogDetailSerializersDepartmentDetailResponseRead = {
  data: DepartmentCatalogItemRead;
};
export type DeviceConnectionListConnectionsDeviceConnectionPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type DeviceConnectionListConnectionsDeviceConnectionPaginationMeta = {
  pagination: DeviceConnectionListConnectionsDeviceConnectionPagination;
};
export type ReportedHardwareId = {
  kind: string;
  value: string;
};
export type DeviceConnection = {
  id: number;
  computing: LabsUidNamedReference;
  equipment: LabsUidNamedReference | null;
  interface: LabsNamedReference | null;
  interface_name: string;
  collector_key: string;
  observation_key: string;
  name: string;
  /** Reported evidence only; not used for matching. */
  serial_number: string;
  /** IDs the agent read from the device; Link registers them on the chosen unit. */
  hardware_ids: ReportedHardwareId[];
  is_attention_required: boolean;
  expected_device_id: number | null;
};
export type DeviceConnectionRead = {
  id: number;
  computing: LabsUidNamedReferenceRead;
  bench: LabsNamedReferenceRead | null;
  equipment: LabsUidNamedReferenceRead | null;
  interface: LabsNamedReferenceRead | null;
  interface_name: string;
  collector_key: string;
  observation_key: string;
  name: string;
  /** Reported evidence only; not used for matching. */
  serial_number: string;
  /** IDs the agent read from the device; Link registers them on the chosen unit. */
  hardware_ids: ReportedHardwareId[];
  state: ChoiceRead;
  match_status: ChoiceRead;
  freshness: ChoiceRead;
  is_attention_required: boolean;
  expected_device_id: number | null;
  observed_at: string;
  received_at: string;
};
export type DeviceConnectionListConnectionsDeviceConnectionPaginatedResponse = {
  meta: DeviceConnectionListConnectionsDeviceConnectionPaginationMeta;
  data: DeviceConnection[];
};
export type DeviceConnectionListConnectionsDeviceConnectionPaginatedResponseRead =
  {
    meta: DeviceConnectionListConnectionsDeviceConnectionPaginationMeta;
    data: DeviceConnectionRead[];
  };
export type DeviceConnectionChange = {
  sequence: number;
  is_complete: boolean;
};
export type DeviceConnectionChangeRead = {
  state: ChoiceRead;
  observed_at: string;
  sequence: number;
  is_complete: boolean;
};
export type DeviceConnectionDetail = {
  id: number;
  computing: LabsUidNamedReference;
  equipment: LabsUidNamedReference | null;
  interface: LabsNamedReference | null;
  interface_name: string;
  collector_key: string;
  observation_key: string;
  name: string;
  /** Reported evidence only; not used for matching. */
  serial_number: string;
  /** IDs the agent read from the device; Link registers them on the chosen unit. */
  hardware_ids: ReportedHardwareId[];
  is_attention_required: boolean;
  expected_device_id: number | null;
  history: DeviceConnectionChange[];
};
export type DeviceConnectionDetailRead = {
  id: number;
  computing: LabsUidNamedReferenceRead;
  bench: LabsNamedReferenceRead | null;
  equipment: LabsUidNamedReferenceRead | null;
  interface: LabsNamedReferenceRead | null;
  interface_name: string;
  collector_key: string;
  observation_key: string;
  name: string;
  /** Reported evidence only; not used for matching. */
  serial_number: string;
  /** IDs the agent read from the device; Link registers them on the chosen unit. */
  hardware_ids: ReportedHardwareId[];
  state: ChoiceRead;
  match_status: ChoiceRead;
  freshness: ChoiceRead;
  is_attention_required: boolean;
  expected_device_id: number | null;
  observed_at: string;
  received_at: string;
  first_seen_at: string;
  history: DeviceConnectionChangeRead[];
};
export type DeviceConnectionDetailConnectionsDeviceConnectionDetailDetailResponse =
  {
    data: DeviceConnectionDetail;
  };
export type DeviceConnectionDetailConnectionsDeviceConnectionDetailDetailResponseRead =
  {
    data: DeviceConnectionDetailRead;
  };
export type DeviceConnectionLinkActionConnectionsDeviceConnectionDetailResponse =
  {
    data: DeviceConnection;
  };
export type DeviceConnectionLinkActionConnectionsDeviceConnectionDetailResponseRead =
  {
    data: DeviceConnectionRead;
  };
export type LinkDeviceConnectionRequest = {
  equipment_id: number;
};
export type DeviceConnectionSummary = {
  connected: number;
  needs_matching: number;
  unconfirmed: number;
  missing: number;
  computing_units: number;
};
export type DeviceConnectionSummaryConnectionsDeviceConnectionSummaryDetailResponse =
  {
    data: DeviceConnectionSummary;
  };
export type DowntimeListSerializersDowntimePagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type DowntimeListSerializersDowntimePaginationMeta = {
  pagination: DowntimeListSerializersDowntimePagination;
};
export type Downtime = {};
export type LabsDowntimeResource = {};
export type DowntimeResourceTypeEnum =
  "room" | "station" | "bench" | "equipment";
export type LabsDowntimeResourceRead = {
  id: number;
  name: string;
  type: DowntimeResourceTypeEnum;
};
export type DowntimeRead = {
  id: number;
  resource: LabsDowntimeResourceRead;
  condition: LabsChoiceReferenceRead;
  kind: LabsChoiceReferenceRead;
  reason: LabsChoiceReferenceRead;
  state: ChoiceRead;
  starts_at: string;
  /** Empty while the end is not known. */
  ends_at: string | null;
  cancelled_at: string | null;
  notes: string;
  actor: UserReferenceRead | null;
  ended_by: UserReferenceRead | null;
  created_at: string;
  updated_at: string;
};
export type DowntimeListSerializersDowntimePaginatedResponse = {
  meta: DowntimeListSerializersDowntimePaginationMeta;
  data: Downtime[];
};
export type DowntimeListSerializersDowntimePaginatedResponseRead = {
  meta: DowntimeListSerializersDowntimePaginationMeta;
  data: DowntimeRead[];
};
export type DowntimeCreateSerializersDowntimeDetailResponse = {
  data: Downtime;
};
export type DowntimeCreateSerializersDowntimeDetailResponseRead = {
  data: DowntimeRead;
};
export type DowntimeCreateConditionEnum = "in_maintenance" | "out_of_service";
export type ReasonEnum =
  | "maintenance"
  | "fault"
  | "calibration"
  | "safety_hold"
  | "renovation"
  | "other";
export type KindEnum = "planned" | "unplanned";
export type NullEnum = null;
export type DowntimeCreate = {
  resource_type: DowntimeResourceTypeEnum;
  resource_id: number;
  condition: DowntimeCreateConditionEnum;
  reason?: ReasonEnum;
  /** Defaults to planned for a window that starts later, otherwise unplanned.
    
    * `planned` - Planned
    * `unplanned` - Unplanned */
  kind?: (KindEnum | NullEnum) | null;
  /** Default: now. */
  starts_at?: string | null;
  /** Empty while the end is not known. */
  ends_at?: string | null;
  notes?: string;
  /** Cancel reserved and in-progress bookings that overlap the window, in the same transaction. */
  cancel_conflicting_bookings?: boolean;
};
export type DowntimeDetailSerializersDowntimeDetailResponse = {
  data: Downtime;
};
export type DowntimeDetailSerializersDowntimeDetailResponseRead = {
  data: DowntimeRead;
};
export type DowntimeCancelSerializersDowntimeDetailResponse = {
  data: Downtime;
};
export type DowntimeCancelSerializersDowntimeDetailResponseRead = {
  data: DowntimeRead;
};
export type DowntimeEndSerializersDowntimeDetailResponse = {
  data: Downtime;
};
export type DowntimeEndSerializersDowntimeDetailResponseRead = {
  data: DowntimeRead;
};
export type EquipmentCollectionApiViewCollectionEquipmentItemPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type EquipmentCollectionApiViewCollectionEquipmentItemPaginationMeta = {
  pagination: EquipmentCollectionApiViewCollectionEquipmentItemPagination;
};
export type EquipmentItem = {};
export type EquipmentPlacement = {};
export type EquipmentPlacementRead = {
  id: number;
  /** Which target is set; ``note`` means an untracked place described by location_note. */
  target_type: ChoiceRead;
  bench: LabsUidNamedReferenceRead | null;
  station: LabsUidNamedReferenceRead | null;
  room: LabsUidNamedReferenceRead | null;
  location_note: string;
  role: string;
  position: number;
  placed_at: string;
};
export type EquipmentLoan = {};
export type EquipmentLoanRead = {
  id: number;
  batch_id: number;
  equipment: LabsUidNamedReferenceRead;
  borrower: UserReferenceRead | null;
  borrower_name: string;
  borrower_contact: string;
  purpose: string;
  booking_id: number | null;
  handed_over_at: string;
  due_at: string;
  is_overdue: boolean;
  condition_out: string;
  returned_at: string | null;
  condition_in: string;
  close_reason: string | null;
};
export type EquipmentReservation = {};
export type EquipmentReservationRead = {
  id: number;
  booking_code: string;
  batch_id: number | null;
  equipment: LabsUidNamedReferenceRead;
  borrower_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  cancellation_reason: string;
};
export type LabsMoney = {};
export type LabsMoneyRead = {
  amount: string;
  currency: string;
};
export type EquipmentDisplaySizeReference = {};
export type EquipmentDisplaySizeReferenceRead = {
  id: number;
  name: string;
};
export type EquipmentDisplayResolutionReference = {};
export type EquipmentDisplayResolutionReferenceRead = {
  id: number;
  name: string;
};
export type EquipmentComputingProfile = {};
export type TechnicalUserReference = {};
export type TechnicalUserReferenceRead = {
  id: number;
  name: string;
};
export type EquipmentComputingProfileRead = {
  /** DNS name used for remote access; falls back to the SKU when empty. */
  hostname: string;
  ip_address: string | null;
  os_name: string;
  disk_usage: any;
  system_info: any;
  monitored_devices: any;
  rdp_file: string | null;
  technical_user: TechnicalUserReferenceRead | null;
};
export type EquipmentItemRead = {
  id: number;
  uid: string;
  category: LabsNamedReferenceRead;
  kind: LabsNamedReferenceRead;
  type: LabsNamedReferenceRead | null;
  sku: string;
  name: string;
  image_url: string | null;
  manufacturer: LabsNamedReferenceRead | null;
  product_model: LabsNamedReferenceRead | null;
  serial_number: string;
  /** Label that already existed on the asset before it was registered. */
  log_label: string;
  owner: UserReferenceRead | null;
  department: LabsNamedReferenceRead | null;
  group: LabsNamedReferenceRead | null;
  placement: EquipmentPlacementRead | null;
  loan: EquipmentLoanRead | null;
  reservations: EquipmentReservationRead[];
  /** Firmware currently installed on this unit. */
  firmware_version: string;
  /** Nameplate power consumption in watts. */
  power_draw_w: number | null;
  weight_kg: string | null;
  warranty_end_date: string | null;
  is_calibration_required: boolean;
  last_calibrated_at: string | null;
  next_calibration_due_at: string | null;
  is_calibration_overdue: boolean;
  metadata: any;
  /** Planned date when the equipment should be replaced. */
  replacement_date: string | null;
  display_status: LabsChoiceReferenceRead | null;
  lifecycle_state: LabsChoiceReferenceRead;
  condition: LabsChoiceReferenceRead;
  acquisition_price: LabsMoneyRead | null;
  created_at: string;
  updated_at: string;
  mac_address: string;
  /** Output channels (power). */
  channels: number | null;
  /** Output capacity in watts (power). */
  power_rating: number | null;
  /** Keys length_mm, width_mm, height_mm (mechanical, furniture). */
  dimensions: any;
  material: LabsNamedReferenceRead | null;
  size: EquipmentDisplaySizeReferenceRead | null;
  resolution: EquipmentDisplayResolutionReferenceRead | null;
  protocol: LabsNamedReferenceRead | null;
  customer: LabsNamedReferenceRead | null;
  interfaces: LabsNamedReferenceRead[];
  characteristics: LabsNamedReferenceRead[];
  computing: EquipmentComputingProfileRead | null;
};
export type EquipmentCollectionApiViewCollectionEquipmentItemPaginatedResponse =
  {
    meta: EquipmentCollectionApiViewCollectionEquipmentItemPaginationMeta;
    data: EquipmentItem[];
  };
export type EquipmentCollectionApiViewCollectionEquipmentItemPaginatedResponseRead =
  {
    meta: EquipmentCollectionApiViewCollectionEquipmentItemPaginationMeta;
    data: EquipmentItemRead[];
  };
export type EquipmentDetail = {};
export type ComputingActivity = {};
export type ComputingActivityRead = {
  status: ChoiceRead;
  remote_user: string;
  remote_user_display_name: string;
  remote_computer: string;
  remote_ip: string | null;
  booking_code: string;
  offline_at: string | null;
  inactive_at: string | null;
  inactive_reminder_count: number;
  updated_at: string;
};
export type EquipmentDetailRead = {
  id: number;
  uid: string;
  category: LabsNamedReferenceRead;
  kind: LabsNamedReferenceRead;
  type: LabsNamedReferenceRead | null;
  sku: string;
  name: string;
  image_url: string | null;
  manufacturer: LabsNamedReferenceRead | null;
  product_model: LabsNamedReferenceRead | null;
  serial_number: string;
  /** Label that already existed on the asset before it was registered. */
  log_label: string;
  owner: UserReferenceRead | null;
  department: LabsNamedReferenceRead | null;
  group: LabsNamedReferenceRead | null;
  placement: EquipmentPlacementRead | null;
  loan: EquipmentLoanRead | null;
  reservations: EquipmentReservationRead[];
  /** Firmware currently installed on this unit. */
  firmware_version: string;
  /** Nameplate power consumption in watts. */
  power_draw_w: number | null;
  weight_kg: string | null;
  warranty_end_date: string | null;
  is_calibration_required: boolean;
  last_calibrated_at: string | null;
  next_calibration_due_at: string | null;
  is_calibration_overdue: boolean;
  metadata: any;
  /** Planned date when the equipment should be replaced. */
  replacement_date: string | null;
  display_status: LabsChoiceReferenceRead | null;
  lifecycle_state: LabsChoiceReferenceRead;
  condition: LabsChoiceReferenceRead;
  acquisition_price: LabsMoneyRead | null;
  created_at: string;
  updated_at: string;
  mac_address: string;
  /** Output channels (power). */
  channels: number | null;
  /** Output capacity in watts (power). */
  power_rating: number | null;
  /** Keys length_mm, width_mm, height_mm (mechanical, furniture). */
  dimensions: any;
  material: LabsNamedReferenceRead | null;
  size: EquipmentDisplaySizeReferenceRead | null;
  resolution: EquipmentDisplayResolutionReferenceRead | null;
  protocol: LabsNamedReferenceRead | null;
  customer: LabsNamedReferenceRead | null;
  interfaces: LabsNamedReferenceRead[];
  characteristics: LabsNamedReferenceRead[];
  computing: EquipmentComputingProfileRead | null;
  activity: ComputingActivityRead | null;
  details: string;
};
export type EquipmentCollectionApiViewCollectionEquipmentDetailDetailResponse =
  {
    data: EquipmentDetail;
  };
export type EquipmentCollectionApiViewCollectionEquipmentDetailDetailResponseRead =
  {
    data: EquipmentDetailRead;
  };
export type EquipmentLifecycleStateEnum =
  "planned" | "in_service" | "transferred_out" | "retired" | "lost";
export type EquipmentComputingProfileCreate = {
  hostname?: string;
};
export type EquipmentCreate = {
  sku: string;
  name?: string;
  serial_number?: string;
  /** Label that already existed on the asset before it was registered. */
  log_label?: string;
  details?: string;
  metadata?: any;
  /** Planned date when the equipment should be replaced. */
  replacement_date?: string | null;
  /** Firmware currently installed on this unit. */
  firmware_version?: string;
  /** Nameplate power consumption in watts. */
  power_draw_w?: number | null;
  weight_kg?: string | null;
  /** Changed only by the change_lifecycle command; history is in EquipmentEvent.
    
    * `planned` - Planned
    * `in_service` - In service
    * `transferred_out` - Transferred out
    * `retired` - Retired
    * `lost` - Lost */
  lifecycle_state?: EquipmentLifecycleStateEnum;
  mac_address?: string;
  /** Output channels (power). */
  channels?: number | null;
  /** Output capacity in watts (power). */
  power_rating?: number | null;
  /** Keys length_mm, width_mm, height_mm (mechanical, furniture). */
  dimensions?: any;
  computing?: EquipmentComputingProfileCreate;
  kind_id: number;
  type_id?: number | null;
  manufacturer_id?: number | null;
  product_model_id?: number | null;
  owner_id?: number | null;
  /** Owning department. */
  department_id?: number | null;
  /** Owning team; must belong to the selected department. */
  group_id?: number | null;
  warranty_end_date?: string | null;
  /** History and due dates are kept as ResourceServiceRecord (kind=calibration). */
  is_calibration_required?: boolean;
  material_id?: number | null;
  size_id?: number | null;
  resolution_id?: number | null;
  protocol_id?: number | null;
  customer_id?: number | null;
  interfaces_ids?: number[];
  characteristics_ids?: number[];
};
export type EquipmentCategoriesCatalogListSerializersEquipmentCategoryPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentCategoriesCatalogListSerializersEquipmentCategoryPaginationMeta =
  {
    pagination: EquipmentCategoriesCatalogListSerializersEquipmentCategoryPagination;
  };
export type EquipmentCategory = {
  /** Stable code used by the code base (e.g. 'computing'). Filled from the name when empty. Renaming the category never changes it. */
  key?: ((string | null) | (string | null)) | null;
  name: string;
  definition: string;
};
export type EquipmentCategoryRead = {
  id: number;
  /** Stable code used by the code base (e.g. 'computing'). Filled from the name when empty. Renaming the category never changes it. */
  key?: ((string | null) | (string | null)) | null;
  name: string;
  definition: string;
  capabilities: ChoiceRead[];
};
export type EquipmentCategoriesCatalogListSerializersEquipmentCategoryPaginatedResponse =
  {
    meta: EquipmentCategoriesCatalogListSerializersEquipmentCategoryPaginationMeta;
    data: EquipmentCategory[];
  };
export type EquipmentCategoriesCatalogListSerializersEquipmentCategoryPaginatedResponseRead =
  {
    meta: EquipmentCategoriesCatalogListSerializersEquipmentCategoryPaginationMeta;
    data: EquipmentCategoryRead[];
  };
export type EquipmentCategoriesCatalogDetailSerializersEquipmentCategoryDetailResponse =
  {
    data: EquipmentCategory;
  };
export type EquipmentCategoriesCatalogDetailSerializersEquipmentCategoryDetailResponseRead =
  {
    data: EquipmentCategoryRead;
  };
export type EquipmentKindCatalogListSerializersEquipmentKindPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type EquipmentKindCatalogListSerializersEquipmentKindPaginationMeta = {
  pagination: EquipmentKindCatalogListSerializersEquipmentKindPagination;
};
export type EquipmentKind = {
  name: string;
};
export type EquipmentKindRead = {
  id: number;
  category_id: number;
  name: string;
};
export type EquipmentKindCatalogListSerializersEquipmentKindPaginatedResponse =
  {
    meta: EquipmentKindCatalogListSerializersEquipmentKindPaginationMeta;
    data: EquipmentKind[];
  };
export type EquipmentKindCatalogListSerializersEquipmentKindPaginatedResponseRead =
  {
    meta: EquipmentKindCatalogListSerializersEquipmentKindPaginationMeta;
    data: EquipmentKindRead[];
  };
export type EquipmentKindCatalogDetailSerializersEquipmentKindDetailResponse = {
  data: EquipmentKind;
};
export type EquipmentKindCatalogDetailSerializersEquipmentKindDetailResponseRead =
  {
    data: EquipmentKindRead;
  };
export type EquipmentLoanBatch = {};
export type EquipmentLoanReminder = {};
export type EquipmentLoanReminderRead = {
  slot: number;
  state: string;
  recipient_email: string;
  created_at: string;
  finished_at: string | null;
};
export type EquipmentLoanBatchRead = {
  id: number;
  borrower: UserReferenceRead | null;
  borrower_name: string;
  borrower_contact: string;
  purpose: string;
  created_at: string;
  open_count: number;
  loans: EquipmentLoanRead[];
  reservations: EquipmentReservationRead[];
  reminders: EquipmentLoanReminderRead[];
};
export type EquipmentLoanBatchDetailSerializersEquipmentLoanBatchDetailResponse =
  {
    data: EquipmentLoanBatch;
  };
export type EquipmentLoanBatchDetailSerializersEquipmentLoanBatchDetailResponseRead =
  {
    data: EquipmentLoanBatchRead;
  };
export type EquipmentLoanListSerializersEquipmentLoanPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type EquipmentLoanListSerializersEquipmentLoanPaginationMeta = {
  pagination: EquipmentLoanListSerializersEquipmentLoanPagination;
};
export type EquipmentLoanListSerializersEquipmentLoanPaginatedResponse = {
  meta: EquipmentLoanListSerializersEquipmentLoanPaginationMeta;
  data: EquipmentLoan[];
};
export type EquipmentLoanListSerializersEquipmentLoanPaginatedResponseRead = {
  meta: EquipmentLoanListSerializersEquipmentLoanPaginationMeta;
  data: EquipmentLoanRead[];
};
export type EquipmentLoanBatchCreatedSerializersEquipmentLoanBatchDetailResponse =
  {
    data: EquipmentLoanBatch;
  };
export type EquipmentLoanBatchCreatedSerializersEquipmentLoanBatchDetailResponseRead =
  {
    data: EquipmentLoanBatchRead;
  };
export type LoanItemOut = {
  equipment_id: number;
  condition_out?: string;
};
export type EquipmentLendBatch = {
  borrower_id?: number | null;
  borrower_name?: string;
  /** Email or phone; for borrowers without an account. */
  borrower_contact?: string;
  purpose?: string;
  equipment_ids: number[];
  /** When the equipment must be back; in the future. */
  due_at: string;
  /** Optional per-item condition notes. */
  items?: LoanItemOut[];
};
export type EquipmentLoansExtendedSerializersEquipmentLoanListResponse = {
  data: EquipmentLoan[];
};
export type EquipmentLoansExtendedSerializersEquipmentLoanListResponseRead = {
  data: EquipmentLoanRead[];
};
export type EquipmentExtendLoans = {
  due_at: string;
  equipment_ids?: number[];
  batch_id?: number | null;
};
export type EquipmentLoansReturnedSerializersEquipmentLoanListResponse = {
  data: EquipmentLoan[];
};
export type EquipmentLoansReturnedSerializersEquipmentLoanListResponseRead = {
  data: EquipmentLoanRead[];
};
export type EquipmentConditionEnum =
  "operational" | "in_maintenance" | "out_of_service";
export type LoanItemIn = {
  condition_in?: string;
  condition?: (EquipmentConditionEnum | NullEnum) | null;
  bench_id?: number | null;
  station_id?: number | null;
  room_id?: number | null;
  location_note?: string;
  equipment_id: number;
};
export type EquipmentReturnBatch = {
  items: LoanItemIn[];
};
export type EquipmentManufacturerCatalogListSerializersEquipmentManufacturerPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentManufacturerCatalogListSerializersEquipmentManufacturerPaginationMeta =
  {
    pagination: EquipmentManufacturerCatalogListSerializersEquipmentManufacturerPagination;
  };
export type EquipmentManufacturer = {
  name: string;
};
export type EquipmentManufacturerRead = {
  id: number;
  name: string;
};
export type EquipmentManufacturerCatalogListSerializersEquipmentManufacturerPaginatedResponse =
  {
    meta: EquipmentManufacturerCatalogListSerializersEquipmentManufacturerPaginationMeta;
    data: EquipmentManufacturer[];
  };
export type EquipmentManufacturerCatalogListSerializersEquipmentManufacturerPaginatedResponseRead =
  {
    meta: EquipmentManufacturerCatalogListSerializersEquipmentManufacturerPaginationMeta;
    data: EquipmentManufacturerRead[];
  };
export type EquipmentManufacturerCatalogDetailSerializersEquipmentManufacturerDetailResponse =
  {
    data: EquipmentManufacturer;
  };
export type EquipmentManufacturerCatalogDetailSerializersEquipmentManufacturerDetailResponseRead =
  {
    data: EquipmentManufacturerRead;
  };
export type EquipmentProductModelCatalogListSerializersEquipmentProductModelPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentProductModelCatalogListSerializersEquipmentProductModelPaginationMeta =
  {
    pagination: EquipmentProductModelCatalogListSerializersEquipmentProductModelPagination;
  };
export type EquipmentProductModel = {
  name: string;
  /** Copied to new assets of this model when empty. */
  default_power_draw_w?: number | null;
  /** Copied to new assets of this model when empty. */
  default_weight_kg?: string | null;
};
export type ProductModelSpecification = {
  value: string;
};
export type ProductModelSpecificationRead = {
  id: number;
  definition: LabsNamedReferenceRead;
  unit: string;
  value_type: ChoiceRead;
  value: string;
};
export type EquipmentProductModelRead = {
  id: number;
  manufacturer_id: number;
  name: string;
  /** Copied to new assets of this model when empty. */
  default_power_draw_w?: number | null;
  /** Copied to new assets of this model when empty. */
  default_weight_kg?: string | null;
  specifications: ProductModelSpecificationRead[];
};
export type EquipmentProductModelCatalogListSerializersEquipmentProductModelPaginatedResponse =
  {
    meta: EquipmentProductModelCatalogListSerializersEquipmentProductModelPaginationMeta;
    data: EquipmentProductModel[];
  };
export type EquipmentProductModelCatalogListSerializersEquipmentProductModelPaginatedResponseRead =
  {
    meta: EquipmentProductModelCatalogListSerializersEquipmentProductModelPaginationMeta;
    data: EquipmentProductModelRead[];
  };
export type EquipmentProductModelCatalogDetailSerializersEquipmentProductModelDetailResponse =
  {
    data: EquipmentProductModel;
  };
export type EquipmentProductModelCatalogDetailSerializersEquipmentProductModelDetailResponseRead =
  {
    data: EquipmentProductModelRead;
  };
export type EquipmentReservationListSerializersEquipmentReservationPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentReservationListSerializersEquipmentReservationPaginationMeta =
  {
    pagination: EquipmentReservationListSerializersEquipmentReservationPagination;
  };
export type EquipmentReservationListSerializersEquipmentReservationPaginatedResponse =
  {
    meta: EquipmentReservationListSerializersEquipmentReservationPaginationMeta;
    data: EquipmentReservation[];
  };
export type EquipmentReservationListSerializersEquipmentReservationPaginatedResponseRead =
  {
    meta: EquipmentReservationListSerializersEquipmentReservationPaginationMeta;
    data: EquipmentReservationRead[];
  };
export type EquipmentReservationCreatedSerializersEquipmentLoanBatchDetailResponse =
  {
    data: EquipmentLoanBatch;
  };
export type EquipmentReservationCreatedSerializersEquipmentLoanBatchDetailResponseRead =
  {
    data: EquipmentLoanBatchRead;
  };
export type EquipmentReserve = {
  borrower_id?: number | null;
  borrower_name?: string;
  /** Email or phone; for borrowers without an account. */
  borrower_contact?: string;
  purpose?: string;
  equipment_ids: number[];
  starts_at: string;
  ends_at: string;
};
export type EquipmentReservationDetailSerializersEquipmentLoanBatchDetailResponse =
  {
    data: EquipmentLoanBatch;
  };
export type EquipmentReservationDetailSerializersEquipmentLoanBatchDetailResponseRead =
  {
    data: EquipmentLoanBatchRead;
  };
export type EquipmentReservationUpdatedSerializersEquipmentLoanBatchDetailResponse =
  {
    data: EquipmentLoanBatch;
  };
export type EquipmentReservationUpdatedSerializersEquipmentLoanBatchDetailResponseRead =
  {
    data: EquipmentLoanBatchRead;
  };
export type PatchedEquipmentReservationUpdate = {
  starts_at?: string | null;
  ends_at?: string | null;
  add_equipment_ids?: number[];
  remove_equipment_ids?: number[];
};
export type EquipmentReservationCancelledSerializersEquipmentLoanBatchDetailResponse =
  {
    data: EquipmentLoanBatch;
  };
export type EquipmentReservationCancelledSerializersEquipmentLoanBatchDetailResponseRead =
  {
    data: EquipmentLoanBatchRead;
  };
export type EquipmentReservationCancel = {
  reason: string;
  /** Cancel only these items; all reserved items when empty. */
  equipment_ids?: number[];
};
export type EquipmentReservationHandedOverSerializersEquipmentLoanBatchDetailResponse =
  {
    data: EquipmentLoanBatch;
  };
export type EquipmentReservationHandedOverSerializersEquipmentLoanBatchDetailResponseRead =
  {
    data: EquipmentLoanBatchRead;
  };
export type EquipmentReservationHandOver = {
  /** Hand over only these items; every open line when empty. */
  equipment_ids?: number[];
  /** Optional per-item condition notes. */
  items?: LoanItemOut[];
};
export type EquipmentTypeCatalogListSerializersEquipmentTypePagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type EquipmentTypeCatalogListSerializersEquipmentTypePaginationMeta = {
  pagination: EquipmentTypeCatalogListSerializersEquipmentTypePagination;
};
export type EquipmentType = {
  name: string;
};
export type EquipmentTypeRead = {
  id: number;
  kind_id: number;
  name: string;
};
export type EquipmentTypeCatalogListSerializersEquipmentTypePaginatedResponse =
  {
    meta: EquipmentTypeCatalogListSerializersEquipmentTypePaginationMeta;
    data: EquipmentType[];
  };
export type EquipmentTypeCatalogListSerializersEquipmentTypePaginatedResponseRead =
  {
    meta: EquipmentTypeCatalogListSerializersEquipmentTypePaginationMeta;
    data: EquipmentTypeRead[];
  };
export type EquipmentTypeCatalogDetailSerializersEquipmentTypeDetailResponse = {
  data: EquipmentType;
};
export type EquipmentTypeCatalogDetailSerializersEquipmentTypeDetailResponseRead =
  {
    data: EquipmentTypeRead;
  };
export type EquipmentDetailAfterConditionChangeCollectionEquipmentDetailDetailResponse =
  {
    data: EquipmentDetail;
  };
export type EquipmentDetailAfterConditionChangeCollectionEquipmentDetailDetailResponseRead =
  {
    data: EquipmentDetailRead;
  };
export type EquipmentChangeCondition = {
  condition: EquipmentConditionEnum;
  reason?: string;
};
export type EquipmentDetailAfterLifecycleChangeCollectionEquipmentDetailDetailResponse =
  {
    data: EquipmentDetail;
  };
export type EquipmentDetailAfterLifecycleChangeCollectionEquipmentDetailDetailResponseRead =
  {
    data: EquipmentDetailRead;
  };
export type EquipmentChangeLifecycle = {
  lifecycle_state: EquipmentLifecycleStateEnum;
  reason?: string;
  /** Required when lifecycle_state is transferred_out. */
  receiving_organisation?: string;
  /** Defaults to today for transferred_out. */
  transfer_date?: string | null;
};
export type EquipmentLoanExtendedSerializersEquipmentLoanDetailResponse = {
  data: EquipmentLoan;
};
export type EquipmentLoanExtendedSerializersEquipmentLoanDetailResponseRead = {
  data: EquipmentLoanRead;
};
export type EquipmentExtendLoan = {
  due_at: string;
};
export type EquipmentLoanOpenedSerializersEquipmentLoanDetailResponse = {
  data: EquipmentLoan;
};
export type EquipmentLoanOpenedSerializersEquipmentLoanDetailResponseRead = {
  data: EquipmentLoanRead;
};
export type EquipmentHandOver = {
  borrower_id?: number | null;
  borrower_name?: string;
  /** Email or phone; for borrowers without an account. */
  borrower_contact?: string;
  purpose?: string;
  /** When the equipment must be back; in the future. */
  due_at: string;
  condition_out?: string;
};
export type EquipmentLoanClosedSerializersEquipmentLoanDetailResponse = {
  data: EquipmentLoan;
};
export type EquipmentLoanClosedSerializersEquipmentLoanDetailResponseRead = {
  data: EquipmentLoanRead;
};
export type EquipmentReturn = {
  condition_in?: string;
  condition?: (EquipmentConditionEnum | NullEnum) | null;
  bench_id?: number | null;
  station_id?: number | null;
  room_id?: number | null;
  location_note?: string;
};
export type ComputingActivityDetailApiComputingActivityDetailResponse = {
  data: ComputingActivity;
};
export type ComputingActivityDetailApiComputingActivityDetailResponseRead = {
  data: ComputingActivityRead;
};
export type EquipmentAssignmentResult = {};
export type EquipmentAssignmentResultRead = {
  id: number;
  equipment: LabsUidNamedReferenceRead;
  bench: LabsUidNamedReferenceRead;
  role: string;
  position: number;
};
export type EquipmentAssignmentDetailSerializersEquipmentAssignmentResultDetailResponse =
  {
    data: EquipmentAssignmentResult;
  };
export type EquipmentAssignmentDetailSerializersEquipmentAssignmentResultDetailResponseRead =
  {
    data: EquipmentAssignmentResultRead;
  };
export type EquipmentAssignmentSerializersEquipmentAssignmentResultDetailResponse =
  {
    data: EquipmentAssignmentResult;
  };
export type EquipmentAssignmentSerializersEquipmentAssignmentResultDetailResponseRead =
  {
    data: EquipmentAssignmentResultRead;
  };
export type EquipmentAssignment = {
  bench_id: number;
  role?: string;
  position?: number;
};
export type EquipmentHardwareId = {
  id: number;
  value: string;
  /** Set only for IDs valid on one computer. */
  computing: LabsUidNamedReference | null;
  created_at: string;
};
export type EquipmentHardwareIdRead = {
  id: number;
  kind: ChoiceRead;
  value: string;
  /** Set only for IDs valid on one computer. */
  computing: LabsUidNamedReferenceRead | null;
  /** Read from a USB port, not from the device. */
  is_port_bound: boolean;
  created_at: string;
};
export type EquipmentHardwareIdList = {
  items: EquipmentHardwareId[];
};
export type EquipmentHardwareIdListRead = {
  items: EquipmentHardwareIdRead[];
};
export type EquipmentHardwareIdListHardwareIdsEquipmentHardwareIdListDetailResponse =
  {
    data: EquipmentHardwareIdList;
  };
export type EquipmentHardwareIdListHardwareIdsEquipmentHardwareIdListDetailResponseRead =
  {
    data: EquipmentHardwareIdListRead;
  };
export type EquipmentHardwareIdCreatedHardwareIdsEquipmentHardwareIdDetailResponse =
  {
    data: EquipmentHardwareId;
  };
export type EquipmentHardwareIdCreatedHardwareIdsEquipmentHardwareIdDetailResponseRead =
  {
    data: EquipmentHardwareIdRead;
  };
export type RegisterHardwareIdRequest = {
  kind: EquipmentHardwareIdKindEnum;
  value: string;
  /** Required for a port-bound PnP ID. */
  computing_id?: number | null;
};
export type EquipmentLoanDetailSerializersEquipmentLoanDetailResponse = {
  data: EquipmentLoan;
};
export type EquipmentLoanDetailSerializersEquipmentLoanDetailResponseRead = {
  data: EquipmentLoanRead;
};
export type EquipmentPlacementDetailSerializersEquipmentPlacementDetailResponse =
  {
    data: EquipmentPlacement;
  };
export type EquipmentPlacementDetailSerializersEquipmentPlacementDetailResponseRead =
  {
    data: EquipmentPlacementRead;
  };
export type EquipmentPlacementUpdatedSerializersEquipmentPlacementDetailResponse =
  {
    data: EquipmentPlacement;
  };
export type EquipmentPlacementUpdatedSerializersEquipmentPlacementDetailResponseRead =
  {
    data: EquipmentPlacementRead;
  };
export type EquipmentPlacementWrite = {
  bench_id?: number | null;
  station_id?: number | null;
  room_id?: number | null;
  /** Required when no target is set; otherwise an optional detail such as a shelf. Trimmed. */
  location_note?: string;
  role?: string;
  position?: number;
};
export type EquipmentStatusChangeListSerializersEquipmentStatusChangePagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentStatusChangeListSerializersEquipmentStatusChangePaginationMeta =
  {
    pagination: EquipmentStatusChangeListSerializersEquipmentStatusChangePagination;
  };
export type EquipmentStatusChange = {};
export type EquipmentStatusChangeRead = {
  display_status: LabsChoiceReferenceRead;
  previous_display_status: LabsChoiceReferenceRead | null;
  occurred_at: string;
  actor: UserReferenceRead | null;
  reason: string;
  details: {
    [key: string]: any;
  };
};
export type EquipmentStatusChangeListSerializersEquipmentStatusChangePaginatedResponse =
  {
    meta: EquipmentStatusChangeListSerializersEquipmentStatusChangePaginationMeta;
    data: EquipmentStatusChange[];
  };
export type EquipmentStatusChangeListSerializersEquipmentStatusChangePaginatedResponseRead =
  {
    meta: EquipmentStatusChangeListSerializersEquipmentStatusChangePaginationMeta;
    data: EquipmentStatusChangeRead[];
  };
export type EquipmentDetailApiViewResponseCollectionEquipmentDetailDetailResponse =
  {
    data: EquipmentDetail;
  };
export type EquipmentDetailApiViewResponseCollectionEquipmentDetailDetailResponseRead =
  {
    data: EquipmentDetailRead;
  };
export type EquipmentComputingProfileUpdate = {
  monitored_devices?: any;
  technical_user_id?: number | null;
};
export type EquipmentUpdate = {
  sku: string;
  name?: string;
  serial_number?: string;
  /** Label that already existed on the asset before it was registered. */
  log_label?: string;
  details?: string;
  metadata?: any;
  /** Planned date when the equipment should be replaced. */
  replacement_date?: string | null;
  /** Firmware currently installed on this unit. */
  firmware_version?: string;
  /** Nameplate power consumption in watts. */
  power_draw_w?: number | null;
  weight_kg?: string | null;
  mac_address?: string;
  /** Output channels (power). */
  channels?: number | null;
  /** Output capacity in watts (power). */
  power_rating?: number | null;
  /** Keys length_mm, width_mm, height_mm (mechanical, furniture). */
  dimensions?: any;
  computing?: EquipmentComputingProfileUpdate;
  kind_id: number;
  type_id?: number | null;
  manufacturer_id?: number | null;
  product_model_id?: number | null;
  owner_id?: number | null;
  /** Owning department. */
  department_id?: number | null;
  /** Owning team; must belong to the selected department. */
  group_id?: number | null;
  warranty_end_date?: string | null;
  /** History and due dates are kept as ResourceServiceRecord (kind=calibration). */
  is_calibration_required?: boolean;
  material_id?: number | null;
  size_id?: number | null;
  resolution_id?: number | null;
  protocol_id?: number | null;
  customer_id?: number | null;
  interfaces_ids?: number[];
  characteristics_ids?: number[];
};
export type PatchedEquipmentUpdate = {
  sku?: string;
  name?: string;
  serial_number?: string;
  /** Label that already existed on the asset before it was registered. */
  log_label?: string;
  details?: string;
  metadata?: any;
  /** Planned date when the equipment should be replaced. */
  replacement_date?: string | null;
  /** Firmware currently installed on this unit. */
  firmware_version?: string;
  /** Nameplate power consumption in watts. */
  power_draw_w?: number | null;
  weight_kg?: string | null;
  mac_address?: string;
  /** Output channels (power). */
  channels?: number | null;
  /** Output capacity in watts (power). */
  power_rating?: number | null;
  /** Keys length_mm, width_mm, height_mm (mechanical, furniture). */
  dimensions?: any;
  computing?: EquipmentComputingProfileUpdate;
  kind_id?: number;
  type_id?: number | null;
  manufacturer_id?: number | null;
  product_model_id?: number | null;
  owner_id?: number | null;
  /** Owning department. */
  department_id?: number | null;
  /** Owning team; must belong to the selected department. */
  group_id?: number | null;
  warranty_end_date?: string | null;
  /** History and due dates are kept as ResourceServiceRecord (kind=calibration). */
  is_calibration_required?: boolean;
  material_id?: number | null;
  size_id?: number | null;
  resolution_id?: number | null;
  protocol_id?: number | null;
  customer_id?: number | null;
  interfaces_ids?: number[];
  characteristics_ids?: number[];
};
export type ComputingActivitySummary = {
  total_count: number;
  /** Resources without a recorded status or with an unrecognized status. */
  unknown_status_count: number;
  /** All code-defined states, including zero counts. Values are extensible. */
  statuses: SummaryStatusCount[];
};
export type ComputingActivitySummaryDataSerializersComputingActivitySummaryDetailResponse =
  {
    data: ComputingActivitySummary;
  };
export type EquipmentFacetsFacetsEquipmentFacetPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type EquipmentFacetsFacetsEquipmentFacetPaginationMeta = {
  pagination: EquipmentFacetsFacetsEquipmentFacetPagination;
};
export type EquipmentFacet = {};
export type FacetValue = {};
export type FacetValueRead = {
  id: number;
  name: string;
};
export type EquipmentFacetRead = {
  value: FacetValueRead | null;
  equipment_count: number;
};
export type EquipmentFacetsFacetsEquipmentFacetPaginatedResponse = {
  meta: EquipmentFacetsFacetsEquipmentFacetPaginationMeta;
  data: EquipmentFacet[];
};
export type EquipmentFacetsFacetsEquipmentFacetPaginatedResponseRead = {
  meta: EquipmentFacetsFacetsEquipmentFacetPaginationMeta;
  data: EquipmentFacetRead[];
};
export type EquipmentFiltersFilteringFilterMetadataDetailResponse = {
  data: FilterMetadata;
};
export type EquipmentReferenceData = {};
export type LabsGroupReference = {};
export type LabsGroupReferenceRead = {
  id: number;
  name: string;
};
export type EquipmentMaterialOption = {};
export type EquipmentMaterialOptionRead = {
  id: number;
  name: string;
};
export type EquipmentDisplaySizeOption = {};
export type EquipmentDisplaySizeOptionRead = {
  id: number;
  /** Label shown in the select, e.g. 27". */
  size: string;
};
export type EquipmentDisplayResolutionOption = {};
export type EquipmentDisplayResolutionOptionRead = {
  id: number;
  /** Label shown in the select, e.g. QHD. */
  resolution: string;
};
export type EquipmentNetworkingProtocolOption = {};
export type EquipmentNetworkingProtocolOptionRead = {
  id: number;
  name: string;
};
export type EquipmentSampleCustomerOption = {};
export type EquipmentSampleCustomerOptionRead = {
  id: number;
  name: string;
};
export type EquipmentInterfaceOption = {};
export type EquipmentInterfaceOptionRead = {
  id: number;
  name: string;
};
export type EquipmentSampleCharacteristicOption = {};
export type EquipmentSampleCharacteristicOptionRead = {
  id: number;
  name: string;
};
export type EquipmentTechnicalUserOption = {};
export type EquipmentTechnicalUserOptionRead = {
  id: number;
  username: string;
};
export type EquipmentReferenceDataRead = {
  kinds: EquipmentKindRead[];
  types: EquipmentTypeRead[];
  manufacturers: EquipmentManufacturerRead[];
  product_models: EquipmentProductModelRead[];
  groups: LabsGroupReferenceRead[];
  owners: UserReferenceRead[];
  categories: EquipmentCategoryRead[];
  materials: EquipmentMaterialOptionRead[];
  sizes: EquipmentDisplaySizeOptionRead[];
  resolutions: EquipmentDisplayResolutionOptionRead[];
  protocols: EquipmentNetworkingProtocolOptionRead[];
  customers: EquipmentSampleCustomerOptionRead[];
  interfaces: EquipmentInterfaceOptionRead[];
  characteristics: EquipmentSampleCharacteristicOptionRead[];
  technical_users: EquipmentTechnicalUserOptionRead[];
};
export type EquipmentReferenceDataCollectionEquipmentReferenceDataDetailResponse =
  {
    data: EquipmentReferenceData;
  };
export type EquipmentReferenceDataCollectionEquipmentReferenceDataDetailResponseRead =
  {
    data: EquipmentReferenceDataRead;
  };
export type EquipmentCategoryReferenceListSerializersEquipmentCategoryCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentCategoryReferenceListSerializersEquipmentCategoryCatalogRecordPaginationMeta =
  {
    pagination: EquipmentCategoryReferenceListSerializersEquipmentCategoryCatalogRecordPagination;
  };
export type EquipmentCategoryCatalogRecord = {};
export type EquipmentCategoryCatalogRecordRead = {
  id: number;
  name: string;
  /** Stable code used by the code base (e.g. 'computing'). Filled from the name when empty. Renaming the category never changes it. */
  key: string | null;
  definition: string;
  /** Units can be lent and reserved. */
  is_bookable: boolean;
  /** Units can be assigned to a bench. */
  is_placeable_on_bench: boolean;
  /** Units may require calibration. */
  is_calibratable: boolean;
  /** Units carry computing columns and may run the monitoring agent (ComputingProfile). */
  is_monitored: boolean;
  is_active: boolean;
};
export type EquipmentCategoryReferenceListSerializersEquipmentCategoryCatalogRecordPaginatedResponse =
  {
    meta: EquipmentCategoryReferenceListSerializersEquipmentCategoryCatalogRecordPaginationMeta;
    data: EquipmentCategoryCatalogRecord[];
  };
export type EquipmentCategoryReferenceListSerializersEquipmentCategoryCatalogRecordPaginatedResponseRead =
  {
    meta: EquipmentCategoryReferenceListSerializersEquipmentCategoryCatalogRecordPaginationMeta;
    data: EquipmentCategoryCatalogRecordRead[];
  };
export type EquipmentCategoryReferenceDetailSerializersEquipmentCategoryCatalogRecordDetailResponse =
  {
    data: EquipmentCategoryCatalogRecord;
  };
export type EquipmentCategoryReferenceDetailSerializersEquipmentCategoryCatalogRecordDetailResponseRead =
  {
    data: EquipmentCategoryCatalogRecordRead;
  };
export type DepartmentReferenceListSerializersDepartmentCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type DepartmentReferenceListSerializersDepartmentCatalogRecordPaginationMeta =
  {
    pagination: DepartmentReferenceListSerializersDepartmentCatalogRecordPagination;
  };
export type DepartmentCatalogRecord = {};
export type DepartmentCatalogRecordRead = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
};
export type DepartmentReferenceListSerializersDepartmentCatalogRecordPaginatedResponse =
  {
    meta: DepartmentReferenceListSerializersDepartmentCatalogRecordPaginationMeta;
    data: DepartmentCatalogRecord[];
  };
export type DepartmentReferenceListSerializersDepartmentCatalogRecordPaginatedResponseRead =
  {
    meta: DepartmentReferenceListSerializersDepartmentCatalogRecordPaginationMeta;
    data: DepartmentCatalogRecordRead[];
  };
export type DepartmentReferenceCreateSerializersDepartmentCatalogRecordDetailResponse =
  {
    data: DepartmentCatalogRecord;
  };
export type DepartmentReferenceCreateSerializersDepartmentCatalogRecordDetailResponseRead =
  {
    data: DepartmentCatalogRecordRead;
  };
export type DepartmentCatalogCreate = {
  name: string;
  description?: string;
  is_active?: boolean;
};
export type DepartmentReferenceDetailSerializersDepartmentCatalogRecordDetailResponse =
  {
    data: DepartmentCatalogRecord;
  };
export type DepartmentReferenceDetailSerializersDepartmentCatalogRecordDetailResponseRead =
  {
    data: DepartmentCatalogRecordRead;
  };
export type DisplayResolutionReferenceListSerializersDisplayResolutionCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type DisplayResolutionReferenceListSerializersDisplayResolutionCatalogRecordPaginationMeta =
  {
    pagination: DisplayResolutionReferenceListSerializersDisplayResolutionCatalogRecordPagination;
  };
export type DisplayResolutionCatalogRecord = {};
export type DisplayResolutionCatalogRecordRead = {
  id: number;
  /** Label shown in the select, e.g. QHD. */
  resolution: string;
  width_px: number | null;
  height_px: number | null;
};
export type DisplayResolutionReferenceListSerializersDisplayResolutionCatalogRecordPaginatedResponse =
  {
    meta: DisplayResolutionReferenceListSerializersDisplayResolutionCatalogRecordPaginationMeta;
    data: DisplayResolutionCatalogRecord[];
  };
export type DisplayResolutionReferenceListSerializersDisplayResolutionCatalogRecordPaginatedResponseRead =
  {
    meta: DisplayResolutionReferenceListSerializersDisplayResolutionCatalogRecordPaginationMeta;
    data: DisplayResolutionCatalogRecordRead[];
  };
export type DisplayResolutionReferenceCreateSerializersDisplayResolutionCatalogRecordDetailResponse =
  {
    data: DisplayResolutionCatalogRecord;
  };
export type DisplayResolutionReferenceCreateSerializersDisplayResolutionCatalogRecordDetailResponseRead =
  {
    data: DisplayResolutionCatalogRecordRead;
  };
export type DisplayResolutionCatalogCreate = {
  /** Label shown in the select, e.g. QHD. */
  resolution: string;
  width_px?: number | null;
  height_px?: number | null;
};
export type DisplayResolutionReferenceDetailSerializersDisplayResolutionCatalogRecordDetailResponse =
  {
    data: DisplayResolutionCatalogRecord;
  };
export type DisplayResolutionReferenceDetailSerializersDisplayResolutionCatalogRecordDetailResponseRead =
  {
    data: DisplayResolutionCatalogRecordRead;
  };
export type DisplaySizeReferenceListSerializersDisplaySizeCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type DisplaySizeReferenceListSerializersDisplaySizeCatalogRecordPaginationMeta =
  {
    pagination: DisplaySizeReferenceListSerializersDisplaySizeCatalogRecordPagination;
  };
export type DisplaySizeCatalogRecord = {};
export type DisplaySizeCatalogRecordRead = {
  id: number;
  /** Label shown in the select, e.g. 27". */
  size: string;
  /** Diagonal in inches. */
  diagonal_in: string | null;
};
export type DisplaySizeReferenceListSerializersDisplaySizeCatalogRecordPaginatedResponse =
  {
    meta: DisplaySizeReferenceListSerializersDisplaySizeCatalogRecordPaginationMeta;
    data: DisplaySizeCatalogRecord[];
  };
export type DisplaySizeReferenceListSerializersDisplaySizeCatalogRecordPaginatedResponseRead =
  {
    meta: DisplaySizeReferenceListSerializersDisplaySizeCatalogRecordPaginationMeta;
    data: DisplaySizeCatalogRecordRead[];
  };
export type DisplaySizeReferenceCreateSerializersDisplaySizeCatalogRecordDetailResponse =
  {
    data: DisplaySizeCatalogRecord;
  };
export type DisplaySizeReferenceCreateSerializersDisplaySizeCatalogRecordDetailResponseRead =
  {
    data: DisplaySizeCatalogRecordRead;
  };
export type DisplaySizeCatalogCreate = {
  /** Label shown in the select, e.g. 27". */
  size: string;
  /** Diagonal in inches. */
  diagonal_in?: string | null;
};
export type DisplaySizeReferenceDetailSerializersDisplaySizeCatalogRecordDetailResponse =
  {
    data: DisplaySizeCatalogRecord;
  };
export type DisplaySizeReferenceDetailSerializersDisplaySizeCatalogRecordDetailResponseRead =
  {
    data: DisplaySizeCatalogRecordRead;
  };
export type GroupReferenceListSerializersGroupCatalogRecordPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type GroupReferenceListSerializersGroupCatalogRecordPaginationMeta = {
  pagination: GroupReferenceListSerializersGroupCatalogRecordPagination;
};
export type GroupCatalogRecord = {};
export type GroupCatalogRecordRead = {
  id: number;
  name: string;
  description: string;
  department_id: number | null;
  is_active: boolean;
};
export type GroupReferenceListSerializersGroupCatalogRecordPaginatedResponse = {
  meta: GroupReferenceListSerializersGroupCatalogRecordPaginationMeta;
  data: GroupCatalogRecord[];
};
export type GroupReferenceListSerializersGroupCatalogRecordPaginatedResponseRead =
  {
    meta: GroupReferenceListSerializersGroupCatalogRecordPaginationMeta;
    data: GroupCatalogRecordRead[];
  };
export type GroupReferenceCreateSerializersGroupCatalogRecordDetailResponse = {
  data: GroupCatalogRecord;
};
export type GroupReferenceCreateSerializersGroupCatalogRecordDetailResponseRead =
  {
    data: GroupCatalogRecordRead;
  };
export type GroupCatalogCreate = {
  name: string;
  description?: string;
  department_id?: number | null;
  is_active?: boolean;
};
export type GroupReferenceDetailSerializersGroupCatalogRecordDetailResponse = {
  data: GroupCatalogRecord;
};
export type GroupReferenceDetailSerializersGroupCatalogRecordDetailResponseRead =
  {
    data: GroupCatalogRecordRead;
  };
export type EquipmentInterfaceReferenceListSerializersEquipmentInterfaceCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentInterfaceReferenceListSerializersEquipmentInterfaceCatalogRecordPaginationMeta =
  {
    pagination: EquipmentInterfaceReferenceListSerializersEquipmentInterfaceCatalogRecordPagination;
  };
export type EquipmentInterfaceCatalogRecord = {};
export type EquipmentInterfaceCatalogRecordRead = {
  id: number;
  name: string;
};
export type EquipmentInterfaceReferenceListSerializersEquipmentInterfaceCatalogRecordPaginatedResponse =
  {
    meta: EquipmentInterfaceReferenceListSerializersEquipmentInterfaceCatalogRecordPaginationMeta;
    data: EquipmentInterfaceCatalogRecord[];
  };
export type EquipmentInterfaceReferenceListSerializersEquipmentInterfaceCatalogRecordPaginatedResponseRead =
  {
    meta: EquipmentInterfaceReferenceListSerializersEquipmentInterfaceCatalogRecordPaginationMeta;
    data: EquipmentInterfaceCatalogRecordRead[];
  };
export type EquipmentInterfaceReferenceCreateSerializersEquipmentInterfaceCatalogRecordDetailResponse =
  {
    data: EquipmentInterfaceCatalogRecord;
  };
export type EquipmentInterfaceReferenceCreateSerializersEquipmentInterfaceCatalogRecordDetailResponseRead =
  {
    data: EquipmentInterfaceCatalogRecordRead;
  };
export type EquipmentInterfaceCatalogCreate = {
  name: string;
};
export type EquipmentInterfaceReferenceDetailSerializersEquipmentInterfaceCatalogRecordDetailResponse =
  {
    data: EquipmentInterfaceCatalogRecord;
  };
export type EquipmentInterfaceReferenceDetailSerializersEquipmentInterfaceCatalogRecordDetailResponseRead =
  {
    data: EquipmentInterfaceCatalogRecordRead;
  };
export type EquipmentKindReferenceListSerializersEquipmentKindCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentKindReferenceListSerializersEquipmentKindCatalogRecordPaginationMeta =
  {
    pagination: EquipmentKindReferenceListSerializersEquipmentKindCatalogRecordPagination;
  };
export type EquipmentKindCatalogRecord = {};
export type EquipmentKindCatalogRecordRead = {
  id: number;
  name: string;
  category_id: number;
  is_active: boolean;
};
export type EquipmentKindReferenceListSerializersEquipmentKindCatalogRecordPaginatedResponse =
  {
    meta: EquipmentKindReferenceListSerializersEquipmentKindCatalogRecordPaginationMeta;
    data: EquipmentKindCatalogRecord[];
  };
export type EquipmentKindReferenceListSerializersEquipmentKindCatalogRecordPaginatedResponseRead =
  {
    meta: EquipmentKindReferenceListSerializersEquipmentKindCatalogRecordPaginationMeta;
    data: EquipmentKindCatalogRecordRead[];
  };
export type EquipmentKindReferenceCreateSerializersEquipmentKindCatalogRecordDetailResponse =
  {
    data: EquipmentKindCatalogRecord;
  };
export type EquipmentKindReferenceCreateSerializersEquipmentKindCatalogRecordDetailResponseRead =
  {
    data: EquipmentKindCatalogRecordRead;
  };
export type EquipmentKindCatalogCreate = {
  name: string;
  category_id: number;
  is_active?: boolean;
};
export type EquipmentKindReferenceDetailSerializersEquipmentKindCatalogRecordDetailResponse =
  {
    data: EquipmentKindCatalogRecord;
  };
export type EquipmentKindReferenceDetailSerializersEquipmentKindCatalogRecordDetailResponseRead =
  {
    data: EquipmentKindCatalogRecordRead;
  };
export type EquipmentManufacturerReferenceListSerializersEquipmentManufacturerCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentManufacturerReferenceListSerializersEquipmentManufacturerCatalogRecordPaginationMeta =
  {
    pagination: EquipmentManufacturerReferenceListSerializersEquipmentManufacturerCatalogRecordPagination;
  };
export type EquipmentManufacturerCatalogRecord = {};
export type EquipmentManufacturerCatalogRecordRead = {
  id: number;
  name: string;
  category_ids: number[];
  is_active: boolean;
};
export type EquipmentManufacturerReferenceListSerializersEquipmentManufacturerCatalogRecordPaginatedResponse =
  {
    meta: EquipmentManufacturerReferenceListSerializersEquipmentManufacturerCatalogRecordPaginationMeta;
    data: EquipmentManufacturerCatalogRecord[];
  };
export type EquipmentManufacturerReferenceListSerializersEquipmentManufacturerCatalogRecordPaginatedResponseRead =
  {
    meta: EquipmentManufacturerReferenceListSerializersEquipmentManufacturerCatalogRecordPaginationMeta;
    data: EquipmentManufacturerCatalogRecordRead[];
  };
export type EquipmentManufacturerReferenceCreateSerializersEquipmentManufacturerCatalogRecordDetailResponse =
  {
    data: EquipmentManufacturerCatalogRecord;
  };
export type EquipmentManufacturerReferenceCreateSerializersEquipmentManufacturerCatalogRecordDetailResponseRead =
  {
    data: EquipmentManufacturerCatalogRecordRead;
  };
export type EquipmentManufacturerCatalogCreate = {
  name: string;
  category_ids?: number[];
  is_active?: boolean;
};
export type EquipmentManufacturerReferenceDetailSerializersEquipmentManufacturerCatalogRecordDetailResponse =
  {
    data: EquipmentManufacturerCatalogRecord;
  };
export type EquipmentManufacturerReferenceDetailSerializersEquipmentManufacturerCatalogRecordDetailResponseRead =
  {
    data: EquipmentManufacturerCatalogRecordRead;
  };
export type MaterialReferenceListSerializersMaterialCatalogRecordPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type MaterialReferenceListSerializersMaterialCatalogRecordPaginationMeta =
  {
    pagination: MaterialReferenceListSerializersMaterialCatalogRecordPagination;
  };
export type MaterialCatalogRecord = {};
export type MaterialCatalogRecordRead = {
  id: number;
  name: string;
};
export type MaterialReferenceListSerializersMaterialCatalogRecordPaginatedResponse =
  {
    meta: MaterialReferenceListSerializersMaterialCatalogRecordPaginationMeta;
    data: MaterialCatalogRecord[];
  };
export type MaterialReferenceListSerializersMaterialCatalogRecordPaginatedResponseRead =
  {
    meta: MaterialReferenceListSerializersMaterialCatalogRecordPaginationMeta;
    data: MaterialCatalogRecordRead[];
  };
export type MaterialReferenceCreateSerializersMaterialCatalogRecordDetailResponse =
  {
    data: MaterialCatalogRecord;
  };
export type MaterialReferenceCreateSerializersMaterialCatalogRecordDetailResponseRead =
  {
    data: MaterialCatalogRecordRead;
  };
export type MaterialCatalogCreate = {
  name: string;
};
export type MaterialReferenceDetailSerializersMaterialCatalogRecordDetailResponse =
  {
    data: MaterialCatalogRecord;
  };
export type MaterialReferenceDetailSerializersMaterialCatalogRecordDetailResponseRead =
  {
    data: MaterialCatalogRecordRead;
  };
export type NetworkingProtocolReferenceListSerializersNetworkingProtocolCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type NetworkingProtocolReferenceListSerializersNetworkingProtocolCatalogRecordPaginationMeta =
  {
    pagination: NetworkingProtocolReferenceListSerializersNetworkingProtocolCatalogRecordPagination;
  };
export type NetworkingProtocolCatalogRecord = {};
export type NetworkingProtocolCatalogRecordRead = {
  id: number;
  name: string;
};
export type NetworkingProtocolReferenceListSerializersNetworkingProtocolCatalogRecordPaginatedResponse =
  {
    meta: NetworkingProtocolReferenceListSerializersNetworkingProtocolCatalogRecordPaginationMeta;
    data: NetworkingProtocolCatalogRecord[];
  };
export type NetworkingProtocolReferenceListSerializersNetworkingProtocolCatalogRecordPaginatedResponseRead =
  {
    meta: NetworkingProtocolReferenceListSerializersNetworkingProtocolCatalogRecordPaginationMeta;
    data: NetworkingProtocolCatalogRecordRead[];
  };
export type NetworkingProtocolReferenceCreateSerializersNetworkingProtocolCatalogRecordDetailResponse =
  {
    data: NetworkingProtocolCatalogRecord;
  };
export type NetworkingProtocolReferenceCreateSerializersNetworkingProtocolCatalogRecordDetailResponseRead =
  {
    data: NetworkingProtocolCatalogRecordRead;
  };
export type NetworkingProtocolCatalogCreate = {
  name: string;
};
export type NetworkingProtocolReferenceDetailSerializersNetworkingProtocolCatalogRecordDetailResponse =
  {
    data: NetworkingProtocolCatalogRecord;
  };
export type NetworkingProtocolReferenceDetailSerializersNetworkingProtocolCatalogRecordDetailResponseRead =
  {
    data: NetworkingProtocolCatalogRecordRead;
  };
export type ProductModelSpecificationReferenceListSerializersProductModelSpecificationCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type ProductModelSpecificationReferenceListSerializersProductModelSpecificationCatalogRecordPaginationMeta =
  {
    pagination: ProductModelSpecificationReferenceListSerializersProductModelSpecificationCatalogRecordPagination;
  };
export type ProductModelSpecificationCatalogRecord = {};
export type ProductModelSpecificationCatalogRecordRead = {
  id: number;
  product_model_id: number;
  definition_id: number;
  value: string;
};
export type ProductModelSpecificationReferenceListSerializersProductModelSpecificationCatalogRecordPaginatedResponse =
  {
    meta: ProductModelSpecificationReferenceListSerializersProductModelSpecificationCatalogRecordPaginationMeta;
    data: ProductModelSpecificationCatalogRecord[];
  };
export type ProductModelSpecificationReferenceListSerializersProductModelSpecificationCatalogRecordPaginatedResponseRead =
  {
    meta: ProductModelSpecificationReferenceListSerializersProductModelSpecificationCatalogRecordPaginationMeta;
    data: ProductModelSpecificationCatalogRecordRead[];
  };
export type ProductModelSpecificationReferenceCreateSerializersProductModelSpecificationCatalogRecordDetailResponse =
  {
    data: ProductModelSpecificationCatalogRecord;
  };
export type ProductModelSpecificationReferenceCreateSerializersProductModelSpecificationCatalogRecordDetailResponseRead =
  {
    data: ProductModelSpecificationCatalogRecordRead;
  };
export type ProductModelSpecificationCatalogCreate = {
  product_model_id: number;
  definition_id: number;
  value: string;
};
export type ProductModelSpecificationReferenceDetailSerializersProductModelSpecificationCatalogRecordDetailResponse =
  {
    data: ProductModelSpecificationCatalogRecord;
  };
export type ProductModelSpecificationReferenceDetailSerializersProductModelSpecificationCatalogRecordDetailResponseRead =
  {
    data: ProductModelSpecificationCatalogRecordRead;
  };
export type EquipmentProductModelReferenceListSerializersEquipmentProductModelCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentProductModelReferenceListSerializersEquipmentProductModelCatalogRecordPaginationMeta =
  {
    pagination: EquipmentProductModelReferenceListSerializersEquipmentProductModelCatalogRecordPagination;
  };
export type EquipmentProductModelCatalogRecord = {};
export type EquipmentProductModelCatalogRecordRead = {
  id: number;
  name: string;
  manufacturer_id: number;
  equipment_type_id: number;
  /** Copied to new assets of this model when empty. */
  default_power_draw_w: number | null;
  /** Copied to new assets of this model when empty. */
  default_weight_kg: string | null;
  is_active: boolean;
};
export type EquipmentProductModelReferenceListSerializersEquipmentProductModelCatalogRecordPaginatedResponse =
  {
    meta: EquipmentProductModelReferenceListSerializersEquipmentProductModelCatalogRecordPaginationMeta;
    data: EquipmentProductModelCatalogRecord[];
  };
export type EquipmentProductModelReferenceListSerializersEquipmentProductModelCatalogRecordPaginatedResponseRead =
  {
    meta: EquipmentProductModelReferenceListSerializersEquipmentProductModelCatalogRecordPaginationMeta;
    data: EquipmentProductModelCatalogRecordRead[];
  };
export type EquipmentProductModelReferenceCreateSerializersEquipmentProductModelCatalogRecordDetailResponse =
  {
    data: EquipmentProductModelCatalogRecord;
  };
export type EquipmentProductModelReferenceCreateSerializersEquipmentProductModelCatalogRecordDetailResponseRead =
  {
    data: EquipmentProductModelCatalogRecordRead;
  };
export type EquipmentProductModelCatalogCreate = {
  name: string;
  manufacturer_id: number;
  equipment_type_id: number;
  /** Copied to new assets of this model when empty. */
  default_power_draw_w?: number | null;
  /** Copied to new assets of this model when empty. */
  default_weight_kg?: string | null;
  is_active?: boolean;
};
export type EquipmentProductModelReferenceDetailSerializersEquipmentProductModelCatalogRecordDetailResponse =
  {
    data: EquipmentProductModelCatalogRecord;
  };
export type EquipmentProductModelReferenceDetailSerializersEquipmentProductModelCatalogRecordDetailResponseRead =
  {
    data: EquipmentProductModelCatalogRecordRead;
  };
export type SampleCharacteristicReferenceListSerializersSampleCharacteristicCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type SampleCharacteristicReferenceListSerializersSampleCharacteristicCatalogRecordPaginationMeta =
  {
    pagination: SampleCharacteristicReferenceListSerializersSampleCharacteristicCatalogRecordPagination;
  };
export type SampleCharacteristicCatalogRecord = {};
export type SampleCharacteristicCatalogRecordRead = {
  id: number;
  name: string;
};
export type SampleCharacteristicReferenceListSerializersSampleCharacteristicCatalogRecordPaginatedResponse =
  {
    meta: SampleCharacteristicReferenceListSerializersSampleCharacteristicCatalogRecordPaginationMeta;
    data: SampleCharacteristicCatalogRecord[];
  };
export type SampleCharacteristicReferenceListSerializersSampleCharacteristicCatalogRecordPaginatedResponseRead =
  {
    meta: SampleCharacteristicReferenceListSerializersSampleCharacteristicCatalogRecordPaginationMeta;
    data: SampleCharacteristicCatalogRecordRead[];
  };
export type SampleCharacteristicReferenceCreateSerializersSampleCharacteristicCatalogRecordDetailResponse =
  {
    data: SampleCharacteristicCatalogRecord;
  };
export type SampleCharacteristicReferenceCreateSerializersSampleCharacteristicCatalogRecordDetailResponseRead =
  {
    data: SampleCharacteristicCatalogRecordRead;
  };
export type SampleCharacteristicCatalogCreate = {
  name: string;
};
export type SampleCharacteristicReferenceDetailSerializersSampleCharacteristicCatalogRecordDetailResponse =
  {
    data: SampleCharacteristicCatalogRecord;
  };
export type SampleCharacteristicReferenceDetailSerializersSampleCharacteristicCatalogRecordDetailResponseRead =
  {
    data: SampleCharacteristicCatalogRecordRead;
  };
export type SampleCustomerReferenceListSerializersSampleCustomerCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type SampleCustomerReferenceListSerializersSampleCustomerCatalogRecordPaginationMeta =
  {
    pagination: SampleCustomerReferenceListSerializersSampleCustomerCatalogRecordPagination;
  };
export type SampleCustomerCatalogRecord = {};
export type SampleCustomerCatalogRecordRead = {
  id: number;
  name: string;
};
export type SampleCustomerReferenceListSerializersSampleCustomerCatalogRecordPaginatedResponse =
  {
    meta: SampleCustomerReferenceListSerializersSampleCustomerCatalogRecordPaginationMeta;
    data: SampleCustomerCatalogRecord[];
  };
export type SampleCustomerReferenceListSerializersSampleCustomerCatalogRecordPaginatedResponseRead =
  {
    meta: SampleCustomerReferenceListSerializersSampleCustomerCatalogRecordPaginationMeta;
    data: SampleCustomerCatalogRecordRead[];
  };
export type SampleCustomerReferenceCreateSerializersSampleCustomerCatalogRecordDetailResponse =
  {
    data: SampleCustomerCatalogRecord;
  };
export type SampleCustomerReferenceCreateSerializersSampleCustomerCatalogRecordDetailResponseRead =
  {
    data: SampleCustomerCatalogRecordRead;
  };
export type SampleCustomerCatalogCreate = {
  name: string;
};
export type SampleCustomerReferenceDetailSerializersSampleCustomerCatalogRecordDetailResponse =
  {
    data: SampleCustomerCatalogRecord;
  };
export type SampleCustomerReferenceDetailSerializersSampleCustomerCatalogRecordDetailResponseRead =
  {
    data: SampleCustomerCatalogRecordRead;
  };
export type SpecificationDefinitionReferenceListSerializersSpecificationDefinitionCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type SpecificationDefinitionReferenceListSerializersSpecificationDefinitionCatalogRecordPaginationMeta =
  {
    pagination: SpecificationDefinitionReferenceListSerializersSpecificationDefinitionCatalogRecordPagination;
  };
export type SpecificationDefinitionCatalogRecord = {};
export type SpecificationDefinitionCatalogRecordRead = {
  id: number;
  name: string;
  category_id: number | null;
  unit: string;
  value_type: ChoiceRead;
  is_active: boolean;
};
export type SpecificationDefinitionReferenceListSerializersSpecificationDefinitionCatalogRecordPaginatedResponse =
  {
    meta: SpecificationDefinitionReferenceListSerializersSpecificationDefinitionCatalogRecordPaginationMeta;
    data: SpecificationDefinitionCatalogRecord[];
  };
export type SpecificationDefinitionReferenceListSerializersSpecificationDefinitionCatalogRecordPaginatedResponseRead =
  {
    meta: SpecificationDefinitionReferenceListSerializersSpecificationDefinitionCatalogRecordPaginationMeta;
    data: SpecificationDefinitionCatalogRecordRead[];
  };
export type SpecificationDefinitionReferenceCreateSerializersSpecificationDefinitionCatalogRecordDetailResponse =
  {
    data: SpecificationDefinitionCatalogRecord;
  };
export type SpecificationDefinitionReferenceCreateSerializersSpecificationDefinitionCatalogRecordDetailResponseRead =
  {
    data: SpecificationDefinitionCatalogRecordRead;
  };
export type ValueTypeEnum = "text" | "number" | "boolean";
export type SpecificationDefinitionCatalogCreate = {
  name: string;
  category_id?: number | null;
  unit?: string;
  value_type?: ValueTypeEnum;
  is_active?: boolean;
};
export type SpecificationDefinitionReferenceDetailSerializersSpecificationDefinitionCatalogRecordDetailResponse =
  {
    data: SpecificationDefinitionCatalogRecord;
  };
export type SpecificationDefinitionReferenceDetailSerializersSpecificationDefinitionCatalogRecordDetailResponseRead =
  {
    data: SpecificationDefinitionCatalogRecordRead;
  };
export type TechnicalUserReferenceListSerializersTechnicalUserCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type TechnicalUserReferenceListSerializersTechnicalUserCatalogRecordPaginationMeta =
  {
    pagination: TechnicalUserReferenceListSerializersTechnicalUserCatalogRecordPagination;
  };
export type TechnicalUserCatalogRecord = {};
export type TechnicalUserCatalogRecordRead = {
  id: number;
  username: string;
};
export type TechnicalUserReferenceListSerializersTechnicalUserCatalogRecordPaginatedResponse =
  {
    meta: TechnicalUserReferenceListSerializersTechnicalUserCatalogRecordPaginationMeta;
    data: TechnicalUserCatalogRecord[];
  };
export type TechnicalUserReferenceListSerializersTechnicalUserCatalogRecordPaginatedResponseRead =
  {
    meta: TechnicalUserReferenceListSerializersTechnicalUserCatalogRecordPaginationMeta;
    data: TechnicalUserCatalogRecordRead[];
  };
export type TechnicalUserReferenceCreateSerializersTechnicalUserCatalogRecordDetailResponse =
  {
    data: TechnicalUserCatalogRecord;
  };
export type TechnicalUserReferenceCreateSerializersTechnicalUserCatalogRecordDetailResponseRead =
  {
    data: TechnicalUserCatalogRecordRead;
  };
export type TechnicalUserCatalogCreate = {
  username: string;
};
export type TechnicalUserReferenceDetailSerializersTechnicalUserCatalogRecordDetailResponse =
  {
    data: TechnicalUserCatalogRecord;
  };
export type TechnicalUserReferenceDetailSerializersTechnicalUserCatalogRecordDetailResponseRead =
  {
    data: TechnicalUserCatalogRecordRead;
  };
export type EquipmentTypeReferenceListSerializersEquipmentTypeCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type EquipmentTypeReferenceListSerializersEquipmentTypeCatalogRecordPaginationMeta =
  {
    pagination: EquipmentTypeReferenceListSerializersEquipmentTypeCatalogRecordPagination;
  };
export type EquipmentTypeCatalogRecord = {};
export type EquipmentTypeCatalogRecordRead = {
  id: number;
  name: string;
  kind_id: number;
  is_active: boolean;
};
export type EquipmentTypeReferenceListSerializersEquipmentTypeCatalogRecordPaginatedResponse =
  {
    meta: EquipmentTypeReferenceListSerializersEquipmentTypeCatalogRecordPaginationMeta;
    data: EquipmentTypeCatalogRecord[];
  };
export type EquipmentTypeReferenceListSerializersEquipmentTypeCatalogRecordPaginatedResponseRead =
  {
    meta: EquipmentTypeReferenceListSerializersEquipmentTypeCatalogRecordPaginationMeta;
    data: EquipmentTypeCatalogRecordRead[];
  };
export type EquipmentTypeReferenceCreateSerializersEquipmentTypeCatalogRecordDetailResponse =
  {
    data: EquipmentTypeCatalogRecord;
  };
export type EquipmentTypeReferenceCreateSerializersEquipmentTypeCatalogRecordDetailResponseRead =
  {
    data: EquipmentTypeCatalogRecordRead;
  };
export type EquipmentTypeCatalogCreate = {
  name: string;
  kind_id: number;
  is_active?: boolean;
};
export type EquipmentTypeReferenceDetailSerializersEquipmentTypeCatalogRecordDetailResponse =
  {
    data: EquipmentTypeCatalogRecord;
  };
export type EquipmentTypeReferenceDetailSerializersEquipmentTypeCatalogRecordDetailResponseRead =
  {
    data: EquipmentTypeCatalogRecordRead;
  };
export type EquipmentBySkuCollectionEquipmentDetailDetailResponse = {
  data: EquipmentDetail;
};
export type EquipmentBySkuCollectionEquipmentDetailDetailResponseRead = {
  data: EquipmentDetailRead;
};
export type EquipmentInventoryStatusSummary = {
  total_count: number;
  /** Resources without a recorded status or with an unrecognized status. */
  unknown_status_count: number;
  /** All code-defined states, including zero counts. Values are extensible. */
  statuses: SummaryStatusCount[];
};
export type EquipmentStatusSummaryDataSerializersEquipmentStatusSummaryDetailResponse =
  {
    data: EquipmentInventoryStatusSummary;
  };
export type EquipmentByUidCollectionEquipmentDetailDetailResponse = {
  data: EquipmentDetail;
};
export type EquipmentByUidCollectionEquipmentDetailDetailResponseRead = {
  data: EquipmentDetailRead;
};
export type ExpectedDeviceListConnectionsExpectedDevicePagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type ExpectedDeviceListConnectionsExpectedDevicePaginationMeta = {
  pagination: ExpectedDeviceListConnectionsExpectedDevicePagination;
};
export type ExpectedDevice = {
  id: number;
  computing: LabsUidNamedReference;
  equipment: LabsUidNamedReference;
  is_disconnect_alert_enabled: boolean;
};
export type ExpectedDeviceRead = {
  id: number;
  computing: LabsUidNamedReferenceRead;
  bench: LabsNamedReferenceRead | null;
  equipment: LabsUidNamedReferenceRead;
  presence: ChoiceRead;
  last_seen_at: string | null;
  is_disconnect_alert_enabled: boolean;
  created_at: string;
};
export type ExpectedDeviceListConnectionsExpectedDevicePaginatedResponse = {
  meta: ExpectedDeviceListConnectionsExpectedDevicePaginationMeta;
  data: ExpectedDevice[];
};
export type ExpectedDeviceListConnectionsExpectedDevicePaginatedResponseRead = {
  meta: ExpectedDeviceListConnectionsExpectedDevicePaginationMeta;
  data: ExpectedDeviceRead[];
};
export type ExpectedDeviceCreateConnectionsExpectedDeviceDetailResponse = {
  data: ExpectedDevice;
};
export type ExpectedDeviceCreateConnectionsExpectedDeviceDetailResponseRead = {
  data: ExpectedDeviceRead;
};
export type CreateExpectedDeviceRequest = {
  computing_id: number;
  equipment_id: number;
  is_disconnect_alert_enabled?: boolean;
};
export type ExpectedDeviceUpdateConnectionsExpectedDeviceDetailResponse = {
  data: ExpectedDevice;
};
export type ExpectedDeviceUpdateConnectionsExpectedDeviceDetailResponseRead = {
  data: ExpectedDeviceRead;
};
export type PatchedUpdateExpectedDeviceRequest = {
  is_disconnect_alert_enabled?: boolean;
};
export type LegacyDeviceSuggestion = {
  /** Windows PnP device instance ID from the legacy list (normalised). */
  pnp_id: string;
  /** Label a coordinator gave the entry in the legacy list. */
  label: string;
  /** Read from a USB port: register it for this computer only. */
  is_port_bound: boolean;
  /** Unit the ID is registered on, if any. */
  equipment: LabsUidNamedReference | null;
  expected_device_id: number | null;
};
export type LegacyDeviceSuggestionRead = {
  /** Windows PnP device instance ID from the legacy list (normalised). */
  pnp_id: string;
  /** Label a coordinator gave the entry in the legacy list. */
  label: string;
  /** Read from a USB port: register it for this computer only. */
  is_port_bound: boolean;
  status: ChoiceRead;
  /** Unit the ID is registered on, if any. */
  equipment: LabsUidNamedReferenceRead | null;
  expected_device_id: number | null;
};
export type LegacyDeviceSuggestionList = {
  items: LegacyDeviceSuggestion[];
};
export type LegacyDeviceSuggestionListRead = {
  items: LegacyDeviceSuggestionRead[];
};
export type LegacyDeviceSuggestionListConnectionsLegacyDeviceSuggestionListDetailResponse =
  {
    data: LegacyDeviceSuggestionList;
  };
export type LegacyDeviceSuggestionListConnectionsLegacyDeviceSuggestionListDetailResponseRead =
  {
    data: LegacyDeviceSuggestionListRead;
  };
export type ExpensePaymentListSerializersExpensePaymentPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type ExpensePaymentListSerializersExpensePaymentPaginationMeta = {
  pagination: ExpensePaymentListSerializersExpensePaymentPagination;
};
export type ExpensePayment = {};
export type Money = {
  /** Decimal string; never a float. */
  amount: string;
  /** ISO 4217 code, uppercase. */
  currency: string;
};
export type ExpensePaymentRead = {
  id: number;
  transaction_type: ChoiceRead;
  total: Money;
  paid_date: string;
  reference: string;
  notes: string;
  created_at: string;
  updated_at: string;
};
export type ExpensePaymentListSerializersExpensePaymentPaginatedResponse = {
  meta: ExpensePaymentListSerializersExpensePaymentPaginationMeta;
  data: ExpensePayment[];
};
export type ExpensePaymentListSerializersExpensePaymentPaginatedResponseRead = {
  meta: ExpensePaymentListSerializersExpensePaymentPaginationMeta;
  data: ExpensePaymentRead[];
};
export type ExpensePaymentSerializersExpensePaymentDetailResponse = {
  data: ExpensePayment;
};
export type ExpensePaymentSerializersExpensePaymentDetailResponseRead = {
  data: ExpensePaymentRead;
};
export type TransactionTypeEnum = "payment" | "refund";
export type ExpensePaymentWrite = {
  transaction_type?: TransactionTypeEnum;
  /** In the expense's currency. */
  total: Money;
  paid_date: string;
  reference?: string;
  notes?: string;
};
export type FinancialReportSummary = {
  expense_count: number;
  payment_count: number;
};
export type FinancialReportSummaryRead = {
  budgeted: Money;
  paid: Money;
  pending: Money;
  refunded: Money;
  expense_count: number;
  payment_count: number;
};
export type FinancialReportTypeBreakdown = {
  count: number;
};
export type FinancialReportTypeBreakdownRead = {
  expense_type: ChoiceRead;
  count: number;
  cost: Money;
  paid: Money;
  pending: Money;
};
export type FinancialReportRoomBreakdown = {
  count: number;
};
export type FinancialReportRoomBreakdownRead = {
  room: LabsNamedReferenceRead;
  count: number;
  cost: Money;
  paid: Money;
  pending: Money;
};
export type FinancialReportStatusBreakdown = {
  count: number;
};
export type FinancialReportStatusBreakdownRead = {
  status: ChoiceRead;
  count: number;
  cost: Money;
};
export type FinancialReportPeriodBreakdown = {
  count: number;
};
export type FinancialReportPeriodBreakdownRead = {
  billing_period: ChoiceRead;
  count: number;
  cost: Money;
  paid: Money;
};
export type FinancialReportItem = {
  id: number;
  name: string;
  supplier: string;
  reference: string;
  start_date: string;
  end_date: string | null;
};
export type FinancialReportItemRead = {
  id: number;
  name: string;
  expense_type: ChoiceRead;
  cost: Money;
  paid: Money;
  pending: Money;
  payment_status: ChoiceRead;
  billing_period: ChoiceRead;
  supplier: string;
  reference: string;
  start_date: string;
  end_date: string | null;
  room: LabsNamedReferenceRead;
};
export type FinancialReportResponse = {
  currency: string;
  summary: FinancialReportSummary;
  by_expense_type: FinancialReportTypeBreakdown[];
  by_room: FinancialReportRoomBreakdown[];
  by_status: FinancialReportStatusBreakdown[];
  by_billing_period: FinancialReportPeriodBreakdown[];
  items: FinancialReportItem[];
};
export type FinancialReportResponseRead = {
  currency: string;
  summary: FinancialReportSummaryRead;
  by_expense_type: FinancialReportTypeBreakdownRead[];
  by_room: FinancialReportRoomBreakdownRead[];
  by_status: FinancialReportStatusBreakdownRead[];
  by_billing_period: FinancialReportPeriodBreakdownRead[];
  items: FinancialReportItemRead[];
};
export type FinancialReportSerializersFinancialReportResponseDetailResponse = {
  data: FinancialReportResponse;
};
export type FinancialReportSerializersFinancialReportResponseDetailResponseRead =
  {
    data: FinancialReportResponseRead;
  };
export type GroupCatalogListSerializersGroupCatalogPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type GroupCatalogListSerializersGroupCatalogPaginationMeta = {
  pagination: GroupCatalogListSerializersGroupCatalogPagination;
};
export type GroupCatalogItem = {
  name: string;
  is_active?: boolean;
};
export type GroupCatalogItemRead = {
  id: number;
  name: string;
  department: LabsNamedReferenceRead | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};
export type GroupCatalogItemWrite = {
  name: string;
  department_id?: number;
  is_active?: boolean;
};
export type GroupCatalogListSerializersGroupCatalogPaginatedResponse = {
  meta: GroupCatalogListSerializersGroupCatalogPaginationMeta;
  data: GroupCatalogItem[];
};
export type GroupCatalogListSerializersGroupCatalogPaginatedResponseRead = {
  meta: GroupCatalogListSerializersGroupCatalogPaginationMeta;
  data: GroupCatalogItemRead[];
};
export type GroupCatalogListSerializersGroupCatalogPaginatedResponseWrite = {
  meta: GroupCatalogListSerializersGroupCatalogPaginationMeta;
  data: GroupCatalogItemWrite[];
};
export type GroupCatalogDetailSerializersGroupCatalogDetailResponse = {
  data: GroupCatalogItem;
};
export type GroupCatalogDetailSerializersGroupCatalogDetailResponseRead = {
  data: GroupCatalogItemRead;
};
export type GroupCatalogDetailSerializersGroupCatalogDetailResponseWrite = {
  data: GroupCatalogItemWrite;
};
export type DashboardLabItem = {
  id: number;
  name: string;
  sku?: string;
  status?: string;
};
export type DashboardUnpaginatedResponse = {
  data: DashboardLabItem[];
};
export type DashboardPaginatedResponse = {
  meta: {
    [key: string]: any;
  };
  data: DashboardLabItem[];
};
export type LabDashboardResponse =
  DashboardUnpaginatedResponse | DashboardPaginatedResponse;
export type LabProjectListSerializersLabProjectPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type LabProjectListSerializersLabProjectPaginationMeta = {
  pagination: LabProjectListSerializersLabProjectPagination;
};
export type LabProject = {};
export type LabProjectRead = {
  id: number;
  name: string;
  /** Short unique project code, e.g. a cost-center number. */
  code: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
};
export type LabProjectListSerializersLabProjectPaginatedResponse = {
  meta: LabProjectListSerializersLabProjectPaginationMeta;
  data: LabProject[];
};
export type LabProjectListSerializersLabProjectPaginatedResponseRead = {
  meta: LabProjectListSerializersLabProjectPaginationMeta;
  data: LabProjectRead[];
};
export type LabProjectDetailSerializersLabProjectDetailResponse = {
  data: LabProject;
};
export type LabProjectDetailSerializersLabProjectDetailResponseRead = {
  data: LabProjectRead;
};
export type SessionLogListSerializersSessionLogItemPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type SessionLogListSerializersSessionLogItemPaginationMeta = {
  pagination: SessionLogListSerializersSessionLogItemPagination;
};
export type SessionLogItem = {};
export type SessionLogItemRead = {
  id: number;
  login_at: string;
  logout_at: string;
  /** Logout minus login, in minutes. */
  duration_minutes: number | null;
  /** Time the user was active, in minutes. */
  active_minutes: number | null;
  computer: LabsUidNamedReferenceRead | null;
  host_name: string | null;
  bench: LabsUidNamedReferenceRead | null;
  remote_user: string | null;
  remote_user_display_name: string | null;
  user: UserReferenceRead | null;
  access_type: ChoiceRead | null;
  booking_code: string | null;
  booking_id: number | null;
};
export type SessionLogListSerializersSessionLogItemPaginatedResponse = {
  meta: SessionLogListSerializersSessionLogItemPaginationMeta;
  data: SessionLogItem[];
};
export type SessionLogListSerializersSessionLogItemPaginatedResponseRead = {
  meta: SessionLogListSerializersSessionLogItemPaginationMeta;
  data: SessionLogItemRead[];
};
export type LeaderboardPersona = {
  id: number;
  username: string;
  display_name?: string;
  avatar?: string | null;
  points: number;
  wfo_rate?: number;
  wfh_rate?: number;
  late_rate?: number;
  usage_efficiency?: number;
  booking_compliance?: number;
  last_remote_at?: string | null;
  labs_accessed?: number;
  total_bookings?: number;
  total_sessions: number;
  total_usage_minutes?: number;
  avg_session_minutes?: number;
  longest_session_minutes?: number;
  top_projects?: string[];
};
export type LeaderboardExportSerializersLeaderboardPersonaListResponse = {
  data: LeaderboardPersona[];
};
export type LeaderboardLab = {
  id: number;
  name: string;
  points: number;
  total_sessions: number;
  active_users?: number;
  last_remote_at?: string | null;
  downtime_minutes?: number;
  top_projects?: string[];
};
export type LeaderboardLabSerializersLeaderboardLabListResponse = {
  data: LeaderboardLab[];
};
export type LeaderboardPersonaSerializersLeaderboardPersonaListResponse = {
  data: LeaderboardPersona[];
};
export type UserProfile = {
  id: number;
  username: string;
  display_name?: string;
  total_sessions: number;
  points: number;
  top_projects?: string[];
};
export type UserProfileSerializersUserProfileDetailResponse = {
  data: UserProfile;
};
export type UserWeeklyUsageSerializersWeeklyUsageSlotListResponse = {
  data: WeeklyUsageSlot[];
};
export type LicenseCategoryCatalogListSerializersLicenseCategoryPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type LicenseCategoryCatalogListSerializersLicenseCategoryPaginationMeta =
  {
    pagination: LicenseCategoryCatalogListSerializersLicenseCategoryPagination;
  };
export type LicenseCategoryCatalogItem = {
  name: string;
};
export type LicenseCategoryCatalogItemRead = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};
export type LicenseCategoryCatalogListSerializersLicenseCategoryPaginatedResponse =
  {
    meta: LicenseCategoryCatalogListSerializersLicenseCategoryPaginationMeta;
    data: LicenseCategoryCatalogItem[];
  };
export type LicenseCategoryCatalogListSerializersLicenseCategoryPaginatedResponseRead =
  {
    meta: LicenseCategoryCatalogListSerializersLicenseCategoryPaginationMeta;
    data: LicenseCategoryCatalogItemRead[];
  };
export type LicenseCategoryCatalogDetailSerializersLicenseCategoryDetailResponse =
  {
    data: LicenseCategoryCatalogItem;
  };
export type LicenseCategoryCatalogDetailSerializersLicenseCategoryDetailResponseRead =
  {
    data: LicenseCategoryCatalogItemRead;
  };
export type LicenseProductCatalogListSerializersLicenseProductPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type LicenseProductCatalogListSerializersLicenseProductPaginationMeta = {
  pagination: LicenseProductCatalogListSerializersLicenseProductPagination;
};
export type LicenseProductCatalogItem = {
  name: string;
};
export type LicenseProductCatalogItemRead = {
  id: number;
  name: string;
  vendor: LabsNamedReferenceRead | null;
  created_at: string;
  updated_at: string;
};
export type LicenseProductCatalogItemWrite = {
  name: string;
  vendor_id?: number;
};
export type LicenseProductCatalogListSerializersLicenseProductPaginatedResponse =
  {
    meta: LicenseProductCatalogListSerializersLicenseProductPaginationMeta;
    data: LicenseProductCatalogItem[];
  };
export type LicenseProductCatalogListSerializersLicenseProductPaginatedResponseRead =
  {
    meta: LicenseProductCatalogListSerializersLicenseProductPaginationMeta;
    data: LicenseProductCatalogItemRead[];
  };
export type LicenseProductCatalogListSerializersLicenseProductPaginatedResponseWrite =
  {
    meta: LicenseProductCatalogListSerializersLicenseProductPaginationMeta;
    data: LicenseProductCatalogItemWrite[];
  };
export type LicenseProductCatalogDetailSerializersLicenseProductDetailResponse =
  {
    data: LicenseProductCatalogItem;
  };
export type LicenseProductCatalogDetailSerializersLicenseProductDetailResponseRead =
  {
    data: LicenseProductCatalogItemRead;
  };
export type LicenseProductCatalogDetailSerializersLicenseProductDetailResponseWrite =
  {
    data: LicenseProductCatalogItemWrite;
  };
export type LicenseRestrictionCatalogListSerializersLicenseRestrictionPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type LicenseRestrictionCatalogListSerializersLicenseRestrictionPaginationMeta =
  {
    pagination: LicenseRestrictionCatalogListSerializersLicenseRestrictionPagination;
  };
export type LicenseRestrictionCatalogItem = {
  name: string;
};
export type LicenseRestrictionCatalogItemRead = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};
export type LicenseRestrictionCatalogListSerializersLicenseRestrictionPaginatedResponse =
  {
    meta: LicenseRestrictionCatalogListSerializersLicenseRestrictionPaginationMeta;
    data: LicenseRestrictionCatalogItem[];
  };
export type LicenseRestrictionCatalogListSerializersLicenseRestrictionPaginatedResponseRead =
  {
    meta: LicenseRestrictionCatalogListSerializersLicenseRestrictionPaginationMeta;
    data: LicenseRestrictionCatalogItemRead[];
  };
export type LicenseRestrictionCatalogDetailSerializersLicenseRestrictionDetailResponse =
  {
    data: LicenseRestrictionCatalogItem;
  };
export type LicenseRestrictionCatalogDetailSerializersLicenseRestrictionDetailResponseRead =
  {
    data: LicenseRestrictionCatalogItemRead;
  };
export type LicenseTypeCatalogListSerializersLicenseTypePagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type LicenseTypeCatalogListSerializersLicenseTypePaginationMeta = {
  pagination: LicenseTypeCatalogListSerializersLicenseTypePagination;
};
export type LicenseTypeCatalogItem = {
  name: string;
};
export type LicenseTypeCatalogItemRead = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};
export type LicenseTypeCatalogListSerializersLicenseTypePaginatedResponse = {
  meta: LicenseTypeCatalogListSerializersLicenseTypePaginationMeta;
  data: LicenseTypeCatalogItem[];
};
export type LicenseTypeCatalogListSerializersLicenseTypePaginatedResponseRead =
  {
    meta: LicenseTypeCatalogListSerializersLicenseTypePaginationMeta;
    data: LicenseTypeCatalogItemRead[];
  };
export type LicenseTypeCatalogDetailSerializersLicenseTypeDetailResponse = {
  data: LicenseTypeCatalogItem;
};
export type LicenseTypeCatalogDetailSerializersLicenseTypeDetailResponseRead = {
  data: LicenseTypeCatalogItemRead;
};
export type LicenseVendorCatalogListSerializersLicenseVendorPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type LicenseVendorCatalogListSerializersLicenseVendorPaginationMeta = {
  pagination: LicenseVendorCatalogListSerializersLicenseVendorPagination;
};
export type LicenseVendorCatalogItem = {
  name: string;
};
export type LicenseVendorCatalogItemRead = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};
export type LicenseVendorCatalogListSerializersLicenseVendorPaginatedResponse =
  {
    meta: LicenseVendorCatalogListSerializersLicenseVendorPaginationMeta;
    data: LicenseVendorCatalogItem[];
  };
export type LicenseVendorCatalogListSerializersLicenseVendorPaginatedResponseRead =
  {
    meta: LicenseVendorCatalogListSerializersLicenseVendorPaginationMeta;
    data: LicenseVendorCatalogItemRead[];
  };
export type LicenseVendorCatalogDetailSerializersLicenseVendorDetailResponse = {
  data: LicenseVendorCatalogItem;
};
export type LicenseVendorCatalogDetailSerializersLicenseVendorDetailResponseRead =
  {
    data: LicenseVendorCatalogItemRead;
  };
export type LicenseListSerializersLicensePagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type LicenseListSerializersLicensePaginationMeta = {
  pagination: LicenseListSerializersLicensePagination;
};
export type License = {};
export type AssignedEquipment = {};
export type AssignedEquipmentRead = {
  id: number;
  uid: string;
  sku: string;
  name: string;
};
export type LicenseRead = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  owner: UserReferenceRead | null;
  department: LabsNamedReferenceRead | null;
  remark: string;
  image_url: string | null;
  product: LabsNamedReferenceRead | null;
  vendor: LabsNamedReferenceRead | null;
  type: LabsNamedReferenceRead | null;
  category: LabsNamedReferenceRead | null;
  restriction: LabsNamedReferenceRead | null;
  /** How many assets may use the license at the same time. */
  seats: number;
  seats_in_use: number;
  assigned_equipment: AssignedEquipmentRead[];
  max_version: string;
  /** Vendor's license serial or ID (for example the Vector license ID). Not secret; agents match the licenses they find to this value. */
  serial_number: string;
  expires_at: string | null;
  status: LabsChoiceReferenceRead | null;
  acquisition_price: LabsMoneyRead | null;
  created_at: string;
  updated_at: string;
};
export type LicenseListSerializersLicensePaginatedResponse = {
  meta: LicenseListSerializersLicensePaginationMeta;
  data: License[];
};
export type LicenseListSerializersLicensePaginatedResponseRead = {
  meta: LicenseListSerializersLicensePaginationMeta;
  data: LicenseRead[];
};
export type LicenseCreateSerializersLicenseDetailResponse = {
  data: License;
};
export type LicenseCreateSerializersLicenseDetailResponseRead = {
  data: LicenseRead;
};
export type LicenseCreate = {
  sku: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  product_id: number;
  vendor_id: number;
  type_id: number;
  category_id: number;
  restriction_id?: number | null;
  seats?: number;
  max_version?: string;
  serial_number?: string;
  expires_at?: string | null;
};
export type LicenseCreateWrite = {
  sku: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  product_id: number;
  vendor_id: number;
  type_id: number;
  category_id: number;
  restriction_id?: number | null;
  seats?: number;
  max_version?: string;
  serial_number?: string;
  identifier?: string;
  expires_at?: string | null;
};
export type LicenseDetailSerializersLicenseDetailResponse = {
  data: License;
};
export type LicenseDetailSerializersLicenseDetailResponseRead = {
  data: LicenseRead;
};
export type LicenseUpdateSerializersLicenseDetailResponse = {
  data: License;
};
export type LicenseUpdateSerializersLicenseDetailResponseRead = {
  data: LicenseRead;
};
export type PatchedLicenseUpdate = {
  sku?: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  product_id?: number;
  vendor_id?: number;
  type_id?: number;
  category_id?: number;
  restriction_id?: number | null;
  seats?: number;
  max_version?: string;
  serial_number?: string;
  expires_at?: string | null;
};
export type PatchedLicenseUpdateWrite = {
  sku?: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  product_id?: number;
  vendor_id?: number;
  type_id?: number;
  category_id?: number;
  restriction_id?: number | null;
  seats?: number;
  max_version?: string;
  serial_number?: string;
  identifier?: string;
  expires_at?: string | null;
};
export type LicenseAssignmentResult = {};
export type LicenseAssignmentResultRead = {
  id: number;
  equipment: LabsUidNamedReferenceRead;
  license: LabsUidNamedReferenceRead;
  assigned_at: string;
  unassigned_at: string | null;
};
export type LicenseAssignActionSerializersLicenseAssignmentResultDetailResponse =
  {
    data: LicenseAssignmentResult;
  };
export type LicenseAssignActionSerializersLicenseAssignmentResultDetailResponseRead =
  {
    data: LicenseAssignmentResultRead;
  };
export type LicenseAssignmentRequest = {
  equipment_id: number;
};
export type LicenseStatusEnum =
  "available" | "assigned" | "expired" | "revoked" | "suspended";
export type LicenseStatus = {
  status: LicenseStatusEnum;
  details?: any;
};
export type LicenseAgreementListSerializersLicenseAgreementPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type LicenseAgreementListSerializersLicenseAgreementPaginationMeta = {
  pagination: LicenseAgreementListSerializersLicenseAgreementPagination;
};
export type LicenseAgreement = {};
export type LicenseAgreementRead = {
  id: number;
  license: LabsNamedReferenceRead;
  price: LabsMoneyRead;
  billing_period: ChoiceRead;
  start_date: string;
  end_date: string | null;
  created_at: string;
};
export type LicenseAgreementListSerializersLicenseAgreementPaginatedResponse = {
  meta: LicenseAgreementListSerializersLicenseAgreementPaginationMeta;
  data: LicenseAgreement[];
};
export type LicenseAgreementListSerializersLicenseAgreementPaginatedResponseRead =
  {
    meta: LicenseAgreementListSerializersLicenseAgreementPaginationMeta;
    data: LicenseAgreementRead[];
  };
export type LicenseAgreementSerializersLicenseAgreementDetailResponse = {
  data: LicenseAgreement;
};
export type LicenseAgreementSerializersLicenseAgreementDetailResponseRead = {
  data: LicenseAgreementRead;
};
export type BillingPeriodEnum = "one_time" | "monthly" | "quarterly" | "annual";
export type LicenseAgreementWrite = {
  price: Money;
  billing_period?: BillingPeriodEnum;
  start_date: string;
  end_date?: string | null;
};
export type LicenseHistorySerializersLicenseStatusRecordPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type LicenseHistorySerializersLicenseStatusRecordPaginationMeta = {
  pagination: LicenseHistorySerializersLicenseStatusRecordPagination;
};
export type LicenseStatusRecord = {};
export type LicenseStatusRecordRead = {
  id: number;
  license: LabsNamedReferenceRead;
  status: LabsChoiceReferenceRead;
  metadata: any;
  actor: UserReferenceRead | null;
  created_at: string;
};
export type LicenseHistorySerializersLicenseStatusRecordPaginatedResponse = {
  meta: LicenseHistorySerializersLicenseStatusRecordPaginationMeta;
  data: LicenseStatusRecord[];
};
export type LicenseHistorySerializersLicenseStatusRecordPaginatedResponseRead =
  {
    meta: LicenseHistorySerializersLicenseStatusRecordPaginationMeta;
    data: LicenseStatusRecordRead[];
  };
export type LicenseCategorySummaryListSerializersLicenseCategorySummaryPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type LicenseCategorySummaryListSerializersLicenseCategorySummaryPaginationMeta =
  {
    pagination: LicenseCategorySummaryListSerializersLicenseCategorySummaryPagination;
  };
export type LicenseCategorySummary = {
  id: number | null;
  name: string | null;
  resource_count: number;
};
export type LicenseCategorySummaryListSerializersLicenseCategorySummaryPaginatedResponse =
  {
    meta: LicenseCategorySummaryListSerializersLicenseCategorySummaryPaginationMeta;
    data: LicenseCategorySummary[];
  };
export type LicenseFiltersFilteringFilterMetadataDetailResponse = {
  data: FilterMetadata;
};
export type LicenseCategoryReferenceListSerializersLicenseCategoryCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type LicenseCategoryReferenceListSerializersLicenseCategoryCatalogRecordPaginationMeta =
  {
    pagination: LicenseCategoryReferenceListSerializersLicenseCategoryCatalogRecordPagination;
  };
export type LicenseCategoryCatalogRecord = {};
export type LicenseCategoryCatalogRecordRead = {
  id: number;
  name: string;
};
export type LicenseCategoryReferenceListSerializersLicenseCategoryCatalogRecordPaginatedResponse =
  {
    meta: LicenseCategoryReferenceListSerializersLicenseCategoryCatalogRecordPaginationMeta;
    data: LicenseCategoryCatalogRecord[];
  };
export type LicenseCategoryReferenceListSerializersLicenseCategoryCatalogRecordPaginatedResponseRead =
  {
    meta: LicenseCategoryReferenceListSerializersLicenseCategoryCatalogRecordPaginationMeta;
    data: LicenseCategoryCatalogRecordRead[];
  };
export type LicenseCategoryReferenceCreateSerializersLicenseCategoryCatalogRecordDetailResponse =
  {
    data: LicenseCategoryCatalogRecord;
  };
export type LicenseCategoryReferenceCreateSerializersLicenseCategoryCatalogRecordDetailResponseRead =
  {
    data: LicenseCategoryCatalogRecordRead;
  };
export type LicenseCategoryCatalogCreate = {
  name: string;
};
export type LicenseCategoryReferenceDetailSerializersLicenseCategoryCatalogRecordDetailResponse =
  {
    data: LicenseCategoryCatalogRecord;
  };
export type LicenseCategoryReferenceDetailSerializersLicenseCategoryCatalogRecordDetailResponseRead =
  {
    data: LicenseCategoryCatalogRecordRead;
  };
export type LicenseProductReferenceListSerializersLicenseProductCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type LicenseProductReferenceListSerializersLicenseProductCatalogRecordPaginationMeta =
  {
    pagination: LicenseProductReferenceListSerializersLicenseProductCatalogRecordPagination;
  };
export type LicenseProductCatalogRecord = {};
export type LicenseProductCatalogRecordRead = {
  id: number;
  name: string;
  vendor_id: number | null;
};
export type LicenseProductReferenceListSerializersLicenseProductCatalogRecordPaginatedResponse =
  {
    meta: LicenseProductReferenceListSerializersLicenseProductCatalogRecordPaginationMeta;
    data: LicenseProductCatalogRecord[];
  };
export type LicenseProductReferenceListSerializersLicenseProductCatalogRecordPaginatedResponseRead =
  {
    meta: LicenseProductReferenceListSerializersLicenseProductCatalogRecordPaginationMeta;
    data: LicenseProductCatalogRecordRead[];
  };
export type LicenseProductReferenceCreateSerializersLicenseProductCatalogRecordDetailResponse =
  {
    data: LicenseProductCatalogRecord;
  };
export type LicenseProductReferenceCreateSerializersLicenseProductCatalogRecordDetailResponseRead =
  {
    data: LicenseProductCatalogRecordRead;
  };
export type LicenseProductCatalogCreate = {
  name: string;
  vendor_id?: number | null;
};
export type LicenseProductReferenceDetailSerializersLicenseProductCatalogRecordDetailResponse =
  {
    data: LicenseProductCatalogRecord;
  };
export type LicenseProductReferenceDetailSerializersLicenseProductCatalogRecordDetailResponseRead =
  {
    data: LicenseProductCatalogRecordRead;
  };
export type LicenseRestrictionReferenceListSerializersLicenseRestrictionCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type LicenseRestrictionReferenceListSerializersLicenseRestrictionCatalogRecordPaginationMeta =
  {
    pagination: LicenseRestrictionReferenceListSerializersLicenseRestrictionCatalogRecordPagination;
  };
export type LicenseRestrictionCatalogRecord = {};
export type LicenseRestrictionCatalogRecordRead = {
  id: number;
  name: string;
};
export type LicenseRestrictionReferenceListSerializersLicenseRestrictionCatalogRecordPaginatedResponse =
  {
    meta: LicenseRestrictionReferenceListSerializersLicenseRestrictionCatalogRecordPaginationMeta;
    data: LicenseRestrictionCatalogRecord[];
  };
export type LicenseRestrictionReferenceListSerializersLicenseRestrictionCatalogRecordPaginatedResponseRead =
  {
    meta: LicenseRestrictionReferenceListSerializersLicenseRestrictionCatalogRecordPaginationMeta;
    data: LicenseRestrictionCatalogRecordRead[];
  };
export type LicenseRestrictionReferenceCreateSerializersLicenseRestrictionCatalogRecordDetailResponse =
  {
    data: LicenseRestrictionCatalogRecord;
  };
export type LicenseRestrictionReferenceCreateSerializersLicenseRestrictionCatalogRecordDetailResponseRead =
  {
    data: LicenseRestrictionCatalogRecordRead;
  };
export type LicenseRestrictionCatalogCreate = {
  name: string;
};
export type LicenseRestrictionReferenceDetailSerializersLicenseRestrictionCatalogRecordDetailResponse =
  {
    data: LicenseRestrictionCatalogRecord;
  };
export type LicenseRestrictionReferenceDetailSerializersLicenseRestrictionCatalogRecordDetailResponseRead =
  {
    data: LicenseRestrictionCatalogRecordRead;
  };
export type LicenseTypeReferenceListSerializersLicenseTypeCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type LicenseTypeReferenceListSerializersLicenseTypeCatalogRecordPaginationMeta =
  {
    pagination: LicenseTypeReferenceListSerializersLicenseTypeCatalogRecordPagination;
  };
export type LicenseTypeCatalogRecord = {};
export type LicenseTypeCatalogRecordRead = {
  id: number;
  name: string;
};
export type LicenseTypeReferenceListSerializersLicenseTypeCatalogRecordPaginatedResponse =
  {
    meta: LicenseTypeReferenceListSerializersLicenseTypeCatalogRecordPaginationMeta;
    data: LicenseTypeCatalogRecord[];
  };
export type LicenseTypeReferenceListSerializersLicenseTypeCatalogRecordPaginatedResponseRead =
  {
    meta: LicenseTypeReferenceListSerializersLicenseTypeCatalogRecordPaginationMeta;
    data: LicenseTypeCatalogRecordRead[];
  };
export type LicenseTypeReferenceCreateSerializersLicenseTypeCatalogRecordDetailResponse =
  {
    data: LicenseTypeCatalogRecord;
  };
export type LicenseTypeReferenceCreateSerializersLicenseTypeCatalogRecordDetailResponseRead =
  {
    data: LicenseTypeCatalogRecordRead;
  };
export type LicenseTypeCatalogCreate = {
  name: string;
};
export type LicenseTypeReferenceDetailSerializersLicenseTypeCatalogRecordDetailResponse =
  {
    data: LicenseTypeCatalogRecord;
  };
export type LicenseTypeReferenceDetailSerializersLicenseTypeCatalogRecordDetailResponseRead =
  {
    data: LicenseTypeCatalogRecordRead;
  };
export type LicenseVendorReferenceListSerializersLicenseVendorCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type LicenseVendorReferenceListSerializersLicenseVendorCatalogRecordPaginationMeta =
  {
    pagination: LicenseVendorReferenceListSerializersLicenseVendorCatalogRecordPagination;
  };
export type LicenseVendorCatalogRecord = {};
export type LicenseVendorCatalogRecordRead = {
  id: number;
  name: string;
};
export type LicenseVendorReferenceListSerializersLicenseVendorCatalogRecordPaginatedResponse =
  {
    meta: LicenseVendorReferenceListSerializersLicenseVendorCatalogRecordPaginationMeta;
    data: LicenseVendorCatalogRecord[];
  };
export type LicenseVendorReferenceListSerializersLicenseVendorCatalogRecordPaginatedResponseRead =
  {
    meta: LicenseVendorReferenceListSerializersLicenseVendorCatalogRecordPaginationMeta;
    data: LicenseVendorCatalogRecordRead[];
  };
export type LicenseVendorReferenceCreateSerializersLicenseVendorCatalogRecordDetailResponse =
  {
    data: LicenseVendorCatalogRecord;
  };
export type LicenseVendorReferenceCreateSerializersLicenseVendorCatalogRecordDetailResponseRead =
  {
    data: LicenseVendorCatalogRecordRead;
  };
export type LicenseVendorCatalogCreate = {
  name: string;
};
export type LicenseVendorReferenceDetailSerializersLicenseVendorCatalogRecordDetailResponse =
  {
    data: LicenseVendorCatalogRecord;
  };
export type LicenseVendorReferenceDetailSerializersLicenseVendorCatalogRecordDetailResponseRead =
  {
    data: LicenseVendorCatalogRecordRead;
  };
export type LicenseStatusSummary = {
  total_count: number;
  /** Resources without a recorded status or with an unrecognized status. */
  unknown_status_count: number;
  /** All code-defined states, including zero counts. Values are extensible. */
  statuses: SummaryStatusCount[];
};
export type LicenseStatusSummaryDataSerializersLicenseStatusSummaryDetailResponse =
  {
    data: LicenseStatusSummary;
  };
export type BuildingReferenceListSerializersBuildingCatalogRecordPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type BuildingReferenceListSerializersBuildingCatalogRecordPaginationMeta =
  {
    pagination: BuildingReferenceListSerializersBuildingCatalogRecordPagination;
  };
export type BuildingCatalogRecord = {};
export type BuildingCatalogRecordRead = {
  id: number;
  name: string;
  city_id: number | null;
  address: string;
};
export type BuildingReferenceListSerializersBuildingCatalogRecordPaginatedResponse =
  {
    meta: BuildingReferenceListSerializersBuildingCatalogRecordPaginationMeta;
    data: BuildingCatalogRecord[];
  };
export type BuildingReferenceListSerializersBuildingCatalogRecordPaginatedResponseRead =
  {
    meta: BuildingReferenceListSerializersBuildingCatalogRecordPaginationMeta;
    data: BuildingCatalogRecordRead[];
  };
export type BuildingReferenceCreateSerializersBuildingCatalogRecordDetailResponse =
  {
    data: BuildingCatalogRecord;
  };
export type BuildingReferenceCreateSerializersBuildingCatalogRecordDetailResponseRead =
  {
    data: BuildingCatalogRecordRead;
  };
export type BuildingCatalogCreate = {
  name: string;
  city_id?: number | null;
  address?: string;
};
export type BuildingReferenceDetailSerializersBuildingCatalogRecordDetailResponse =
  {
    data: BuildingCatalogRecord;
  };
export type BuildingReferenceDetailSerializersBuildingCatalogRecordDetailResponseRead =
  {
    data: BuildingCatalogRecordRead;
  };
export type CityReferenceListSerializersCityCatalogRecordPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type CityReferenceListSerializersCityCatalogRecordPaginationMeta = {
  pagination: CityReferenceListSerializersCityCatalogRecordPagination;
};
export type CityCatalogRecord = {};
export type CityCatalogRecordRead = {
  id: number;
  name: string;
  country_id: number | null;
};
export type CityReferenceListSerializersCityCatalogRecordPaginatedResponse = {
  meta: CityReferenceListSerializersCityCatalogRecordPaginationMeta;
  data: CityCatalogRecord[];
};
export type CityReferenceListSerializersCityCatalogRecordPaginatedResponseRead =
  {
    meta: CityReferenceListSerializersCityCatalogRecordPaginationMeta;
    data: CityCatalogRecordRead[];
  };
export type CityReferenceCreateSerializersCityCatalogRecordDetailResponse = {
  data: CityCatalogRecord;
};
export type CityReferenceCreateSerializersCityCatalogRecordDetailResponseRead =
  {
    data: CityCatalogRecordRead;
  };
export type CityCatalogCreate = {
  name: string;
  country_id?: number | null;
};
export type CityReferenceDetailSerializersCityCatalogRecordDetailResponse = {
  data: CityCatalogRecord;
};
export type CityReferenceDetailSerializersCityCatalogRecordDetailResponseRead =
  {
    data: CityCatalogRecordRead;
  };
export type CountryReferenceListSerializersCountryCatalogRecordPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type CountryReferenceListSerializersCountryCatalogRecordPaginationMeta =
  {
    pagination: CountryReferenceListSerializersCountryCatalogRecordPagination;
  };
export type CountryCatalogRecord = {};
export type CountryCatalogRecordRead = {
  id: number;
  name: string;
  code: string;
};
export type CountryReferenceListSerializersCountryCatalogRecordPaginatedResponse =
  {
    meta: CountryReferenceListSerializersCountryCatalogRecordPaginationMeta;
    data: CountryCatalogRecord[];
  };
export type CountryReferenceListSerializersCountryCatalogRecordPaginatedResponseRead =
  {
    meta: CountryReferenceListSerializersCountryCatalogRecordPaginationMeta;
    data: CountryCatalogRecordRead[];
  };
export type CountryReferenceCreateSerializersCountryCatalogRecordDetailResponse =
  {
    data: CountryCatalogRecord;
  };
export type CountryReferenceCreateSerializersCountryCatalogRecordDetailResponseRead =
  {
    data: CountryCatalogRecordRead;
  };
export type CountryCatalogCreate = {
  name: string;
  code: string;
};
export type CountryReferenceDetailSerializersCountryCatalogRecordDetailResponse =
  {
    data: CountryCatalogRecord;
  };
export type CountryReferenceDetailSerializersCountryCatalogRecordDetailResponseRead =
  {
    data: CountryCatalogRecordRead;
  };
export type StationTypeReferenceListSerializersStationTypeCatalogRecordPagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type StationTypeReferenceListSerializersStationTypeCatalogRecordPaginationMeta =
  {
    pagination: StationTypeReferenceListSerializersStationTypeCatalogRecordPagination;
  };
export type StationTypeCatalogRecord = {};
export type StationTypeCatalogRecordRead = {
  id: number;
  name: string;
};
export type StationTypeReferenceListSerializersStationTypeCatalogRecordPaginatedResponse =
  {
    meta: StationTypeReferenceListSerializersStationTypeCatalogRecordPaginationMeta;
    data: StationTypeCatalogRecord[];
  };
export type StationTypeReferenceListSerializersStationTypeCatalogRecordPaginatedResponseRead =
  {
    meta: StationTypeReferenceListSerializersStationTypeCatalogRecordPaginationMeta;
    data: StationTypeCatalogRecordRead[];
  };
export type StationTypeReferenceCreateSerializersStationTypeCatalogRecordDetailResponse =
  {
    data: StationTypeCatalogRecord;
  };
export type StationTypeReferenceCreateSerializersStationTypeCatalogRecordDetailResponseRead =
  {
    data: StationTypeCatalogRecordRead;
  };
export type StationTypeCatalogCreate = {
  name: string;
};
export type StationTypeReferenceDetailSerializersStationTypeCatalogRecordDetailResponse =
  {
    data: StationTypeCatalogRecord;
  };
export type StationTypeReferenceDetailSerializersStationTypeCatalogRecordDetailResponseRead =
  {
    data: StationTypeCatalogRecordRead;
  };
export type MonitoringEventListSerializersMonitoringEventPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type MonitoringEventListSerializersMonitoringEventPaginationMeta = {
  pagination: MonitoringEventListSerializersMonitoringEventPagination;
};
export type MonitoringEvent = {};
export type MonitoringSubject = {};
export type MonitoringSubjectRead = {
  type: string;
  key: string;
  name: string;
};
export type MonitoringEventRead = {
  id: number;
  computer: LabsNamedReferenceRead | null;
  bench: LabsNamedReferenceRead | null;
  agent_key: string;
  agent_version: string;
  event_key: string;
  reported_at: string;
  occurred_at: string;
  action: ChoiceRead;
  action_name: string;
  subject: MonitoringSubjectRead;
  payload: any;
  technical_user: string;
  remote_user: string;
  remote_user_display_name: string;
};
export type MonitoringEventListSerializersMonitoringEventPaginatedResponse = {
  meta: MonitoringEventListSerializersMonitoringEventPaginationMeta;
  data: MonitoringEvent[];
};
export type MonitoringEventListSerializersMonitoringEventPaginatedResponseRead =
  {
    meta: MonitoringEventListSerializersMonitoringEventPaginationMeta;
    data: MonitoringEventRead[];
  };
export type MonitoringEventSerializersMonitoringEventDetailResponse = {
  data: MonitoringEvent;
};
export type MonitoringEventSerializersMonitoringEventDetailResponseRead = {
  data: MonitoringEventRead;
};
export type ActionEnum =
  | "heartbeat"
  | "device_inserted"
  | "device_removed"
  | "device_changed"
  | "device_status_changed"
  | "inventory_snapshot"
  | "metric_reported"
  | "alert_raised"
  | "alert_resolved"
  | "custom";
export type MonitoringEventCreate = {
  computer_sku?: string | null;
  computer_id?: number | null;
  action?: ActionEnum;
  action_name?: string;
  subject_type?: string;
  subject_id?: string;
  subject_name?: string;
  payload?: any;
  occurred_at?: string | null;
  agent_id?: string;
  agent_version?: string;
  event_id?: string;
  source?: string;
  event_type?: string;
  category?: string;
  object_name?: string;
  object_id?: string;
  details?: any;
};
export type MonitoringEventDetailSerializersMonitoringEventDetailResponse = {
  data: MonitoringEvent;
};
export type MonitoringEventDetailSerializersMonitoringEventDetailResponseRead =
  {
    data: MonitoringEventRead;
  };
export type MonitoringEventExportSerializersMonitoringEventListResponse = {
  data: MonitoringEvent[];
};
export type MonitoringEventExportSerializersMonitoringEventListResponseRead = {
  data: MonitoringEventRead[];
};
export type PurchaseItemResourceListSerializersPurchaseItemResourcePagination =
  {
    count: number;
    page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
export type PurchaseItemResourceListSerializersPurchaseItemResourcePaginationMeta =
  {
    pagination: PurchaseItemResourceListSerializersPurchaseItemResourcePagination;
  };
export type PurchaseItemResource = {};
export type PurchaseItemResourceRead = {
  id: number;
  purchase_item: {
    [key: string]: number | string;
  };
  resource: {
    [key: string]: number | string;
  } | null;
  resource_kind: ChoiceRead;
  acquisition_price: {
    amount: string;
    /** Purchase currency code. */
    currency: string;
  };
  created_at: string;
};
export type PurchaseItemResourceListSerializersPurchaseItemResourcePaginatedResponse =
  {
    meta: PurchaseItemResourceListSerializersPurchaseItemResourcePaginationMeta;
    data: PurchaseItemResource[];
  };
export type PurchaseItemResourceListSerializersPurchaseItemResourcePaginatedResponseRead =
  {
    meta: PurchaseItemResourceListSerializersPurchaseItemResourcePaginationMeta;
    data: PurchaseItemResourceRead[];
  };
export type PurchaseItemResourceSerializersPurchaseItemResourceDetailResponse =
  {
    data: PurchaseItemResource;
  };
export type PurchaseItemResourceSerializersPurchaseItemResourceDetailResponseRead =
  {
    data: PurchaseItemResourceRead;
  };
export type PurchaseItemResourceCreate = any;
export type PurchaseItemResourceCreateWrite = any;
export type PurchasePriorityOption = {};
export type PurchasePriorityOptionRead = {
  id: number;
  code: string;
  name: string;
};
export type PurchasePriorityOptionsSerializersPurchasePriorityOptionListResponse =
  {
    data: PurchasePriorityOption[];
  };
export type PurchasePriorityOptionsSerializersPurchasePriorityOptionListResponseRead =
  {
    data: PurchasePriorityOptionRead[];
  };
export type PurchaseListSerializersPurchasePagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type PurchaseListSerializersPurchasePaginationMeta = {
  pagination: PurchaseListSerializersPurchasePagination;
};
export type Purchase = {
  supplier: string;
  purchase_order_number?: string;
  purchase_date: string;
  total: Money;
  notes?: string;
};
export type PurchaseRead = {
  id: number;
  supplier: string;
  purchase_order_number?: string;
  purchase_date: string;
  status: {
    [key: string]: string;
  };
  total: Money;
  item_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};
export type PurchaseItem = {
  description: string;
  quantity?: number;
  notes?: string;
  purpose?: string | null;
  unit?: string | null;
};
export type PurchaseItemRead = {
  id: number;
  description: string;
  quantity?: number;
  notes?: string;
  purpose?: string | null;
  unit?: string | null;
  created_at: string;
};
export type PurchaseItemWrite = {
  description: string;
  quantity?: number;
  unit_price?: Money;
  notes?: string;
  purpose?: string | null;
  priority_id?: number | null;
  unit?: string | null;
};
export type PurchaseWrite = {
  supplier: string;
  purchase_order_number?: string;
  purchase_date: string;
  total: Money;
  notes?: string;
  items?: PurchaseItemWrite[];
};
export type PurchaseListSerializersPurchasePaginatedResponse = {
  meta: PurchaseListSerializersPurchasePaginationMeta;
  data: Purchase[];
};
export type PurchaseListSerializersPurchasePaginatedResponseRead = {
  meta: PurchaseListSerializersPurchasePaginationMeta;
  data: PurchaseRead[];
};
export type PurchaseListSerializersPurchasePaginatedResponseWrite = {
  meta: PurchaseListSerializersPurchasePaginationMeta;
  data: PurchaseWrite[];
};
export type PurchaseSerializersPurchaseDetailResponse = {
  data: Purchase;
};
export type PurchaseSerializersPurchaseDetailResponseRead = {
  data: PurchaseRead;
};
export type PurchaseSerializersPurchaseDetailResponseWrite = {
  data: PurchaseWrite;
};
export type PurchaseDetail = {};
export type PurchaseDetailRead = {
  id: number;
  supplier: string;
  purchase_order_number: string;
  purchase_date: string;
  total: Money;
  status: ChoiceRead;
  notes: string;
  version: number;
  item_count: number;
  lines_total: {
    amount: string;
    /** Purchase currency code. */
    currency: string;
  };
  unpriced_line_count: number;
  created_at: string;
  updated_at: string;
};
export type PurchaseDetailSerializersPurchaseDetailDetailResponse = {
  data: PurchaseDetail;
};
export type PurchaseDetailSerializersPurchaseDetailDetailResponseRead = {
  data: PurchaseDetailRead;
};
export type PurchaseDraftHeaderOutput = {};
export type PurchaseDraftHeaderOutputRead = {
  id: number;
  supplier: string;
  purchase_order_number: string;
  purchase_date: string;
  total: Money;
  status: ChoiceRead;
  notes: string;
  version: number;
};
export type PurchaseDraftHeaderSerializersPurchaseDraftHeaderOutputDetailResponse =
  {
    data: PurchaseDraftHeaderOutput;
  };
export type PurchaseDraftHeaderSerializersPurchaseDraftHeaderOutputDetailResponseRead =
  {
    data: PurchaseDraftHeaderOutputRead;
  };
export type PatchedPurchaseDraftHeaderInput = {
  supplier?: string;
  purchase_date?: string;
  purchase_order_number?: string;
  total?: Money;
  notes?: string;
};
export type PurchaseItemListSerializersPurchaseItemReadPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type PurchaseItemListSerializersPurchaseItemReadPaginationMeta = {
  pagination: PurchaseItemListSerializersPurchaseItemReadPagination;
};
export type PurchaseItemRead2 = {};
export type PurchaseItemReadRead = {
  id: number;
  purchase: {
    [key: string]: any;
  };
  description: string;
  quantity: number;
  unit: string;
  unit_price: Money;
  line_value: {
    amount: string;
    /** Purchase currency code. */
    currency: string;
  };
  priority: {
    [key: string]: number | string;
  } | null;
  purpose: string;
  notes: string;
  created_at: string;
};
export type PurchaseItemListSerializersPurchaseItemReadPaginatedResponse = {
  meta: PurchaseItemListSerializersPurchaseItemReadPaginationMeta;
  data: PurchaseItemRead2[];
};
export type PurchaseItemListSerializersPurchaseItemReadPaginatedResponseRead = {
  meta: PurchaseItemListSerializersPurchaseItemReadPaginationMeta;
  data: PurchaseItemReadRead[];
};
export type PurchaseItemSerializersPurchaseItemReadDetailResponse = {
  data: PurchaseItemRead2;
};
export type PurchaseItemSerializersPurchaseItemReadDetailResponseRead = {
  data: PurchaseItemReadRead;
};
export type PurchaseItemDetail = {};
export type PurchaseItemDetailRead = {
  id: number;
  purchase: {
    [key: string]: any;
  };
  description: string;
  quantity: number;
  unit: string;
  unit_price: Money;
  line_value: {
    amount: string;
    /** Purchase currency code. */
    currency: string;
  };
  priority: {
    [key: string]: number | string;
  } | null;
  purpose: string;
  notes: string;
  created_at: string;
  version: number;
};
export type PurchaseDraftLineSerializersPurchaseItemDetailDetailResponse = {
  data: PurchaseItemDetail;
};
export type PurchaseDraftLineSerializersPurchaseItemDetailDetailResponseRead = {
  data: PurchaseItemDetailRead;
};
export type PatchedDraftLinePatchInput = {
  description?: string;
  quantity?: number;
  unit_price?: Money;
  notes?: string;
  purpose?: string | null;
  priority_id?: number | null;
  unit?: string | null;
};
export type PurchaseDraftLineDeletedEmptyResponse = {};
export type PurchaseDraftLineDeletedEmptyResponseRead = {
  data: {
    [key: string]: any;
  };
};
export type PurchaseDraftLineListSerializersPurchaseItemDetailListResponse = {
  data: PurchaseItemDetail[];
};
export type PurchaseDraftLineListSerializersPurchaseItemDetailListResponseRead =
  {
    data: PurchaseItemDetailRead[];
  };
export type DraftLineInput = {
  description: string;
  quantity: number;
  unit_price: Money;
  notes?: string;
  purpose?: string | null;
  priority_id?: number | null;
  unit?: string | null;
};
export type PurchaseTransactionListSerializersPurchaseTransactionPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type PurchaseTransactionListSerializersPurchaseTransactionPaginationMeta =
  {
    pagination: PurchaseTransactionListSerializersPurchaseTransactionPagination;
  };
export type PurchaseTransaction = {};
export type PurchaseTransactionRead = {
  id: number;
  purchase: {
    [key: string]: number | string;
  };
  transaction_type: ChoiceRead;
  total: Money;
  settled_at: string;
  /** Invoice, receipt, bank transaction, or refund reference. */
  reference: string;
  notes: string;
  created_at: string;
};
export type PurchaseTransactionListSerializersPurchaseTransactionPaginatedResponse =
  {
    meta: PurchaseTransactionListSerializersPurchaseTransactionPaginationMeta;
    data: PurchaseTransaction[];
  };
export type PurchaseTransactionListSerializersPurchaseTransactionPaginatedResponseRead =
  {
    meta: PurchaseTransactionListSerializersPurchaseTransactionPaginationMeta;
    data: PurchaseTransactionRead[];
  };
export type PurchaseTransactionSerializersPurchaseTransactionDetailResponse = {
  data: PurchaseTransaction;
};
export type PurchaseTransactionSerializersPurchaseTransactionDetailResponseRead =
  {
    data: PurchaseTransactionRead;
  };
export type PurchaseTransactionWrite = {
  transaction_type: TransactionTypeEnum;
  /** In the purchase's currency. */
  total: Money;
  settled_at: string;
  /** Invoice, receipt, bank transaction, or refund reference. */
  reference?: string;
  notes?: string;
};
export type BenchMappingPage = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type BenchMappingSummary = {
  /** Benches matching the filters (state not applied). */
  benches: number;
  fully_mapped: number;
  needs_equipment: number;
  needs_placement: number;
  /** Units placed on those benches. */
  equipment: number;
};
export type BenchMappingListMeta = {
  pagination: BenchMappingPage;
  summary: BenchMappingSummary;
};
export type BenchMappingListResponse = {
  data: ResourceMappingData;
  meta: BenchMappingListMeta;
};
export type TypedResourceAuditListSerializersResourceAuditItemPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type TypedResourceAuditListSerializersResourceAuditItemPaginationMeta = {
  pagination: TypedResourceAuditListSerializersResourceAuditItemPagination;
};
export type TypedResourceAuditListSerializersResourceAuditItemPaginatedResponse =
  {
    meta: TypedResourceAuditListSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItem[];
  };
export type TypedResourceAuditListSerializersResourceAuditItemPaginatedResponseRead =
  {
    meta: TypedResourceAuditListSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItemRead[];
  };
export type TypedResourceAuditItemSerializersResourceAuditItemDetailResponse = {
  data: ResourceAuditItem;
};
export type TypedResourceAuditItemSerializersResourceAuditItemDetailResponseRead =
  {
    data: ResourceAuditItemRead;
  };
export type RecordResourceAuditRequest = {
  result: AuditResultInputEnum;
  remarks?: string;
  audited_at?: string | null;
};
export type ResourceAuditListByIdSerializersResourceAuditItemPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type ResourceAuditListByIdSerializersResourceAuditItemPaginationMeta = {
  pagination: ResourceAuditListByIdSerializersResourceAuditItemPagination;
};
export type ResourceAuditListByIdSerializersResourceAuditItemPaginatedResponse =
  {
    meta: ResourceAuditListByIdSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItem[];
  };
export type ResourceAuditListByIdSerializersResourceAuditItemPaginatedResponseRead =
  {
    meta: ResourceAuditListByIdSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItemRead[];
  };
export type ResourceAuditItemByIdSerializersResourceAuditItemDetailResponse = {
  data: ResourceAuditItem;
};
export type ResourceAuditItemByIdSerializersResourceAuditItemDetailResponseRead =
  {
    data: ResourceAuditItemRead;
  };
export type ResourceAuditListBySkuSerializersResourceAuditItemPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type ResourceAuditListBySkuSerializersResourceAuditItemPaginationMeta = {
  pagination: ResourceAuditListBySkuSerializersResourceAuditItemPagination;
};
export type ResourceAuditListBySkuSerializersResourceAuditItemPaginatedResponse =
  {
    meta: ResourceAuditListBySkuSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItem[];
  };
export type ResourceAuditListBySkuSerializersResourceAuditItemPaginatedResponseRead =
  {
    meta: ResourceAuditListBySkuSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItemRead[];
  };
export type ResourceAuditItemBySkuSerializersResourceAuditItemDetailResponse = {
  data: ResourceAuditItem;
};
export type ResourceAuditItemBySkuSerializersResourceAuditItemDetailResponseRead =
  {
    data: ResourceAuditItemRead;
  };
export type ResourceAuditListByUidSerializersResourceAuditItemPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type ResourceAuditListByUidSerializersResourceAuditItemPaginationMeta = {
  pagination: ResourceAuditListByUidSerializersResourceAuditItemPagination;
};
export type ResourceAuditListByUidSerializersResourceAuditItemPaginatedResponse =
  {
    meta: ResourceAuditListByUidSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItem[];
  };
export type ResourceAuditListByUidSerializersResourceAuditItemPaginatedResponseRead =
  {
    meta: ResourceAuditListByUidSerializersResourceAuditItemPaginationMeta;
    data: ResourceAuditItemRead[];
  };
export type ResourceAuditItemByUidSerializersResourceAuditItemDetailResponse = {
  data: ResourceAuditItem;
};
export type ResourceAuditItemByUidSerializersResourceAuditItemDetailResponseRead =
  {
    data: ResourceAuditItemRead;
  };
export type RoomListSerializersRoomPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type RoomListSerializersRoomPaginationMeta = {
  pagination: RoomListSerializersRoomPagination;
};
export type Room = {};
export type RoomRead = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  /** Position within the parent location, e.g. R1C1 or U12. */
  label: string | null;
  department: LabsNamedReferenceRead | null;
  group: LabsNamedReferenceRead | null;
  owner: UserReferenceRead | null;
  remark: string;
  image_url: string | null;
  map_url: string;
  length_m: string | null;
  width_m: string | null;
  area_m2: string | null;
  country: LabsNamedReferenceRead | null;
  city: LabsNamedReferenceRead | null;
  building: LabsNamedReferenceRead | null;
  floor: string;
  layout_rows: number | null;
  layout_columns: number | null;
  slot_capacity: number | null;
  usable_height_m: string | null;
  coordinate_unit: string;
  floor_plan_revision: string;
  floor_plan_url: string;
  /** Deprecated: computed from lifecycle_status, condition, access_policy and activity_status. */
  status: LabsChoiceReferenceRead | null;
  lifecycle_status: LabsChoiceReferenceRead;
  access_policy: LabsChoiceReferenceRead;
  condition: LabsChoiceReferenceRead;
  availability: LabsAvailabilityRead;
  activity_status: LabsChoiceReferenceRead;
  max_occupancy: number | null;
  power_capacity_w: number | null;
  cooling_capacity_w: number | null;
  network_port_capacity: number | null;
  utilities: any;
  location_path: string;
  created_at: string;
  updated_at: string;
};
export type RoomListSerializersRoomPaginatedResponse = {
  meta: RoomListSerializersRoomPaginationMeta;
  data: Room[];
};
export type RoomListSerializersRoomPaginatedResponseRead = {
  meta: RoomListSerializersRoomPaginationMeta;
  data: RoomRead[];
};
export type RoomCreateSerializersRoomDetailResponse = {
  data: Room;
};
export type RoomCreateSerializersRoomDetailResponseRead = {
  data: RoomRead;
};
export type RoomCreate = {
  sku: string;
  name?: string;
  /** Position within the parent location, e.g. R1C1 or U12. */
  label?: string | null;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  map_url?: string;
  length_m?: string | null;
  width_m?: string | null;
  country_id?: number | null;
  city_id?: number | null;
  building_id?: number | null;
  floor?: string;
  layout_rows?: number | null;
  layout_columns?: number | null;
  usable_height_m?: string | null;
  floor_plan_revision?: string;
  floor_plan_url?: string;
  max_occupancy?: number | null;
  power_capacity_w?: number | null;
  cooling_capacity_w?: number | null;
  network_port_capacity?: number | null;
  utilities?: {
    [key: string]: any;
  };
};
export type RoomDetailSerializersRoomDetailResponse = {
  data: Room;
};
export type RoomDetailSerializersRoomDetailResponseRead = {
  data: RoomRead;
};
export type RoomReplaceSerializersRoomDetailResponse = {
  data: Room;
};
export type RoomReplaceSerializersRoomDetailResponseRead = {
  data: RoomRead;
};
export type RoomUpdate = {
  sku: string;
  name?: string;
  /** Position within the parent location, e.g. R1C1 or U12. */
  label?: string | null;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  map_url?: string;
  length_m?: string | null;
  width_m?: string | null;
  country_id?: number | null;
  city_id?: number | null;
  building_id?: number | null;
  floor?: string;
  layout_rows?: number | null;
  layout_columns?: number | null;
  usable_height_m?: string | null;
  floor_plan_revision?: string;
  floor_plan_url?: string;
  max_occupancy?: number | null;
  power_capacity_w?: number | null;
  cooling_capacity_w?: number | null;
  network_port_capacity?: number | null;
  utilities?: {
    [key: string]: any;
  };
};
export type RoomUpdateSerializersRoomDetailResponse = {
  data: Room;
};
export type RoomUpdateSerializersRoomDetailResponseRead = {
  data: RoomRead;
};
export type PatchedRoomUpdate = {
  sku?: string;
  name?: string;
  /** Position within the parent location, e.g. R1C1 or U12. */
  label?: string | null;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  map_url?: string;
  length_m?: string | null;
  width_m?: string | null;
  country_id?: number | null;
  city_id?: number | null;
  building_id?: number | null;
  floor?: string;
  layout_rows?: number | null;
  layout_columns?: number | null;
  usable_height_m?: string | null;
  floor_plan_revision?: string;
  floor_plan_url?: string;
  max_occupancy?: number | null;
  power_capacity_w?: number | null;
  cooling_capacity_w?: number | null;
  network_port_capacity?: number | null;
  utilities?: {
    [key: string]: any;
  };
};
export type RoomLifecycleChangeSerializersRoomDetailResponse = {
  data: Room;
};
export type RoomLifecycleChangeSerializersRoomDetailResponseRead = {
  data: RoomRead;
};
export type AccessPolicyEnum = "open" | "restricted";
export type RoomLifecycleWrite = {
  lifecycle_status?: LifecycleStatusEnum;
  access_policy?: AccessPolicyEnum;
  metadata?: {
    [key: string]: any;
  };
};
export type RoomStatusChangeSerializersRoomDetailResponse = {
  data: Room;
};
export type RoomStatusChangeSerializersRoomDetailResponseRead = {
  data: RoomRead;
};
export type RoomStatusEnum =
  | "available"
  | "reserved"
  | "issue"
  | "restricted"
  | "closed"
  | "maintenance"
  | "retired";
export type RoomStatusWrite = {
  status: RoomStatusEnum;
  metadata?: {
    [key: string]: any;
  };
};
export type RoomSlotGenerateSerializersRoomSlotPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type RoomSlotGenerateSerializersRoomSlotPaginationMeta = {
  pagination: RoomSlotGenerateSerializersRoomSlotPagination;
};
export type RoomSlot = {};
export type RoomSlotRead = {
  id: number;
  room_id: number;
  row_index: number;
  col_index: number;
  slot_code: string;
  slot_type: ChoiceRead;
  /** Deprecated: available, occupied, blocked or retired (occupied is computed). */
  status: LabsChoiceReferenceRead;
  service_status: LabsChoiceReferenceRead;
  is_occupied: boolean;
  x_mm: number | null;
  y_mm: number | null;
  width_mm: number | null;
  depth_mm: number | null;
  orientation_degrees: number;
  max_load_kg: number | null;
  power_capacity_w: number | null;
  utilities: any;
  is_accessible: boolean;
  clearance_width_mm: number | null;
  created_at: string;
  updated_at: string;
};
export type RoomSlotGenerateSerializersRoomSlotPaginatedResponse = {
  meta: RoomSlotGenerateSerializersRoomSlotPaginationMeta;
  data: RoomSlot[];
};
export type RoomSlotGenerateSerializersRoomSlotPaginatedResponseRead = {
  meta: RoomSlotGenerateSerializersRoomSlotPaginationMeta;
  data: RoomSlotRead[];
};
export type RoomExpenseListSerializersExpensePagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type RoomExpenseListSerializersExpensePaginationMeta = {
  pagination: RoomExpenseListSerializersExpensePagination;
};
export type Expense = {};
export type ExpenseRead = {
  id: number;
  room: {
    [key: string]: number | string;
  };
  name: string;
  expense_type: ChoiceRead;
  supplier: string;
  reference: string;
  cost: Money;
  billing_period: ChoiceRead;
  start_date: string;
  end_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};
export type RoomExpenseListSerializersExpensePaginatedResponse = {
  meta: RoomExpenseListSerializersExpensePaginationMeta;
  data: Expense[];
};
export type RoomExpenseListSerializersExpensePaginatedResponseRead = {
  meta: RoomExpenseListSerializersExpensePaginationMeta;
  data: ExpenseRead[];
};
export type RoomExpenseSerializersExpenseDetailResponse = {
  data: Expense;
};
export type RoomExpenseSerializersExpenseDetailResponseRead = {
  data: ExpenseRead;
};
export type ExpenseTypeEnum =
  | "rent"
  | "utilities"
  | "maintenance"
  | "calibration"
  | "repair"
  | "service_contract"
  | "license_fee"
  | "insurance"
  | "service"
  | "other";
export type ExpenseWrite = {
  name: string;
  expense_type: ExpenseTypeEnum;
  supplier?: string;
  reference?: string;
  /** What the expense costs (FMT-2, FMT-7). */
  cost: Money;
  billing_period?: BillingPeriodEnum;
  start_date: string;
  end_date?: string | null;
  notes?: string;
};
export type RoomFinancialReportSerializersFinancialReportResponseDetailResponse =
  {
    data: FinancialReportResponse;
  };
export type RoomFinancialReportSerializersFinancialReportResponseDetailResponseRead =
  {
    data: FinancialReportResponseRead;
  };
export type RoomHistorySerializersRoomStatusRecordPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type RoomHistorySerializersRoomStatusRecordPaginationMeta = {
  pagination: RoomHistorySerializersRoomStatusRecordPagination;
};
export type RoomStatusRecord = {};
export type RoomStatusRecordRead = {
  id: number;
  room: number;
  status: LabsChoiceReferenceRead;
  metadata: any;
  actor: UserReferenceRead | null;
  created_at: string;
};
export type RoomHistorySerializersRoomStatusRecordPaginatedResponse = {
  meta: RoomHistorySerializersRoomStatusRecordPaginationMeta;
  data: RoomStatusRecord[];
};
export type RoomHistorySerializersRoomStatusRecordPaginatedResponseRead = {
  meta: RoomHistorySerializersRoomStatusRecordPaginationMeta;
  data: RoomStatusRecordRead[];
};
export type RoomObservationListSerializersRoomObservationPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type RoomObservationListSerializersRoomObservationPaginationMeta = {
  pagination: RoomObservationListSerializersRoomObservationPagination;
};
export type RoomObservation = {};
export type RoomObservationRead = {
  id: number;
  room: number;
  observed_at: string;
  source: string;
  temperature_c: string | null;
  humidity_percent: string | null;
  power_usage_w: number | null;
  created_at: string;
};
export type RoomObservationListSerializersRoomObservationPaginatedResponse = {
  meta: RoomObservationListSerializersRoomObservationPaginationMeta;
  data: RoomObservation[];
};
export type RoomObservationListSerializersRoomObservationPaginatedResponseRead =
  {
    meta: RoomObservationListSerializersRoomObservationPaginationMeta;
    data: RoomObservationRead[];
  };
export type RoomObservationCreateSerializersRoomObservationDetailResponse = {
  data: RoomObservation;
};
export type RoomObservationCreateSerializersRoomObservationDetailResponseRead =
  {
    data: RoomObservationRead;
  };
export type RoomObservationWrite = {
  observed_at: string;
  source: string;
  temperature_c?: string | null;
  humidity_percent?: string | null;
  power_usage_w?: number | null;
};
export type RoomSlotListSerializersRoomSlotPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type RoomSlotListSerializersRoomSlotPaginationMeta = {
  pagination: RoomSlotListSerializersRoomSlotPagination;
};
export type RoomSlotListSerializersRoomSlotPaginatedResponse = {
  meta: RoomSlotListSerializersRoomSlotPaginationMeta;
  data: RoomSlot[];
};
export type RoomSlotListSerializersRoomSlotPaginatedResponseRead = {
  meta: RoomSlotListSerializersRoomSlotPaginationMeta;
  data: RoomSlotRead[];
};
export type RoomFiltersFilteringFilterMetadataDetailResponse = {
  data: FilterMetadata;
};
export type RoomStatusSummary = {
  total_count: number;
  /** Resources without a recorded status or with an unrecognized status. */
  unknown_status_count: number;
  /** All code-defined states, including zero counts. Values are extensible. */
  statuses: SummaryStatusCount[];
};
export type RoomStatusSummaryDataSerializersRoomStatusSummaryDetailResponse = {
  data: RoomStatusSummary;
};
export type StationTypeListSerializersStationTypePagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type StationTypeListSerializersStationTypePaginationMeta = {
  pagination: StationTypeListSerializersStationTypePagination;
};
export type StationType = {};
export type StationTypeRead = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};
export type StationTypeListSerializersStationTypePaginatedResponse = {
  meta: StationTypeListSerializersStationTypePaginationMeta;
  data: StationType[];
};
export type StationTypeListSerializersStationTypePaginatedResponseRead = {
  meta: StationTypeListSerializersStationTypePaginationMeta;
  data: StationTypeRead[];
};
export type StationTypeCreateSerializersStationTypeDetailResponse = {
  data: StationType;
};
export type StationTypeCreateSerializersStationTypeDetailResponseRead = {
  data: StationTypeRead;
};
export type StationTypeWrite = {
  name: string;
};
export type StationTypeDetailSerializersStationTypeDetailResponse = {
  data: StationType;
};
export type StationTypeDetailSerializersStationTypeDetailResponseRead = {
  data: StationTypeRead;
};
export type StationTypeUpdateSerializersStationTypeDetailResponse = {
  data: StationType;
};
export type StationTypeUpdateSerializersStationTypeDetailResponseRead = {
  data: StationTypeRead;
};
export type PatchedStationTypeWrite = {
  name?: string;
};
export type StationListSerializersStationPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type StationListSerializersStationPaginationMeta = {
  pagination: StationListSerializersStationPagination;
};
export type Station = {};
export type LabsCoordinate3D = {};
export type LabsCoordinate3DRead = {
  x: number;
  y: number;
  z: number;
};
export type StationRead = {
  id: number;
  uid: string;
  sku: string;
  name: string;
  department: LabsNamedReferenceRead | null;
  group: LabsNamedReferenceRead | null;
  owner: UserReferenceRead | null;
  remark: string;
  /** Position within the parent location, e.g. R1C1 or U12. */
  label: string | null;
  type: LabsNamedReferenceRead | null;
  room: LabsUidNamedReferenceRead | null;
  slot: LabsNamedReferenceRead | null;
  position: LabsCoordinate3DRead | null;
  height_mm: number | null;
  width_mm: number | null;
  depth_mm: number | null;
  orientation_degrees: number;
  max_load_kg: number | null;
  bench_capacity: number | null;
  max_concurrent_users: number | null;
  usable_surface_mm2: number | null;
  power_capacity_w: number | null;
  power_reserved_w: number;
  cooling_capacity_w: number | null;
  network_port_capacity: number | null;
  utilities: any;
  /** Deprecated: computed from lifecycle_status, condition, access_policy and activity_status. */
  status: LabsChoiceReferenceRead | null;
  lifecycle_status: LabsChoiceReferenceRead;
  access_policy: LabsChoiceReferenceRead;
  condition: LabsChoiceReferenceRead;
  availability: LabsAvailabilityRead;
  activity_status: LabsChoiceReferenceRead;
  safety_classification: string;
  image_url: string | null;
  active_bench_count: number;
  allocated_power_w: number;
  available_power_w: number | null;
  available_slot_count: number;
  location_path: string;
  slot_count: number;
  slots_url: string;
  created_at: string;
  updated_at: string;
};
export type StationListSerializersStationPaginatedResponse = {
  meta: StationListSerializersStationPaginationMeta;
  data: Station[];
};
export type StationListSerializersStationPaginatedResponseRead = {
  meta: StationListSerializersStationPaginationMeta;
  data: StationRead[];
};
export type StationCreateSerializersStationDetailResponse = {
  data: Station;
};
export type StationCreateSerializersStationDetailResponseRead = {
  data: StationRead;
};
export type StationCreate = {
  sku: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  /** Position within the parent location, e.g. R1C1 or U12. */
  label?: string | null;
  type_id?: number | null;
  room_id?: number | null;
  slot_id?: number | null;
  position?: any | null;
  height_mm?: number | null;
  width_mm?: number | null;
  depth_mm?: number | null;
  orientation_degrees?: number;
  max_load_kg?: number | null;
  bench_capacity?: number | null;
  max_concurrent_users?: number | null;
  usable_surface_mm2?: number | null;
  power_capacity_w?: number | null;
  power_reserved_w?: number;
  cooling_capacity_w?: number | null;
  network_port_capacity?: number | null;
  utilities?: {
    [key: string]: any;
  };
  safety_classification?: string;
};
export type StationDetailSerializersStationDetailResponse = {
  data: Station;
};
export type StationDetailSerializersStationDetailResponseRead = {
  data: StationRead;
};
export type StationReplaceSerializersStationDetailResponse = {
  data: Station;
};
export type StationReplaceSerializersStationDetailResponseRead = {
  data: StationRead;
};
export type StationUpdate = {
  sku: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  /** Position within the parent location, e.g. R1C1 or U12. */
  label?: string | null;
  type_id?: number | null;
  room_id?: number | null;
  slot_id?: number | null;
  position?: any | null;
  height_mm?: number | null;
  width_mm?: number | null;
  depth_mm?: number | null;
  orientation_degrees?: number;
  max_load_kg?: number | null;
  bench_capacity?: number | null;
  max_concurrent_users?: number | null;
  usable_surface_mm2?: number | null;
  power_capacity_w?: number | null;
  power_reserved_w?: number;
  cooling_capacity_w?: number | null;
  network_port_capacity?: number | null;
  utilities?: {
    [key: string]: any;
  };
  safety_classification?: string;
};
export type StationUpdateSerializersStationDetailResponse = {
  data: Station;
};
export type StationUpdateSerializersStationDetailResponseRead = {
  data: StationRead;
};
export type PatchedStationUpdate = {
  sku?: string;
  name?: string;
  department_id?: number | null;
  group_id?: number | null;
  owner_id?: number | null;
  remark?: string;
  /** Position within the parent location, e.g. R1C1 or U12. */
  label?: string | null;
  type_id?: number | null;
  room_id?: number | null;
  slot_id?: number | null;
  position?: any | null;
  height_mm?: number | null;
  width_mm?: number | null;
  depth_mm?: number | null;
  orientation_degrees?: number;
  max_load_kg?: number | null;
  bench_capacity?: number | null;
  max_concurrent_users?: number | null;
  usable_surface_mm2?: number | null;
  power_capacity_w?: number | null;
  power_reserved_w?: number;
  cooling_capacity_w?: number | null;
  network_port_capacity?: number | null;
  utilities?: {
    [key: string]: any;
  };
  safety_classification?: string;
};
export type StationLifecycleChangeSerializersStationDetailResponse = {
  data: Station;
};
export type StationLifecycleChangeSerializersStationDetailResponseRead = {
  data: StationRead;
};
export type StationLifecycleWrite = {
  lifecycle_status?: LifecycleStatusEnum;
  access_policy?: AccessPolicyEnum;
  metadata?: {
    [key: string]: any;
  };
};
export type StationStatusChangeSerializersStationDetailResponse = {
  data: Station;
};
export type StationStatusChangeSerializersStationDetailResponseRead = {
  data: StationRead;
};
export type StationStatusWrite = {
  status: RoomStatusEnum;
  metadata?: {
    [key: string]: any;
  };
};
export type StationPlaceActionSerializersStationDetailResponse = {
  data: Station;
};
export type StationPlaceActionSerializersStationDetailResponseRead = {
  data: StationRead;
};
export type StationPlacement = {
  room_id?: number | null;
  slot_id?: number | null;
  power_reserved_w?: string;
  position?: any | null;
  orientation_degrees?: number;
};
export type StationPlacementSerializersStationDetailResponse = {
  data: Station;
};
export type StationPlacementSerializersStationDetailResponseRead = {
  data: StationRead;
};
export type PatchedStationPlacement = {
  room_id?: number | null;
  slot_id?: number | null;
  power_reserved_w?: string;
  position?: any | null;
  orientation_degrees?: number;
};
export type StationHistorySerializersStationStatusRecordPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type StationHistorySerializersStationStatusRecordPaginationMeta = {
  pagination: StationHistorySerializersStationStatusRecordPagination;
};
export type StationStatusRecord = {};
export type StationStatusRecordRead = {
  id: number;
  station: number;
  status: LabsChoiceReferenceRead;
  metadata: any;
  actor: UserReferenceRead | null;
  created_at: string;
};
export type StationHistorySerializersStationStatusRecordPaginatedResponse = {
  meta: StationHistorySerializersStationStatusRecordPaginationMeta;
  data: StationStatusRecord[];
};
export type StationHistorySerializersStationStatusRecordPaginatedResponseRead =
  {
    meta: StationHistorySerializersStationStatusRecordPaginationMeta;
    data: StationStatusRecordRead[];
  };
export type StationSlotListSerializersStationSlotPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type StationSlotListSerializersStationSlotPaginationMeta = {
  pagination: StationSlotListSerializersStationSlotPagination;
};
export type StationSlot = {};
export type StationSlotRead = {
  id: number;
  station_id: number;
  position_index: number;
  slot_code: string;
  label: string;
  /** Deprecated: service_status is in_service. */
  is_active: boolean;
  /** Deprecated: available, occupied, out_of_service or retired (occupied is computed). */
  status: LabsChoiceReferenceRead;
  service_status: LabsChoiceReferenceRead;
  width_mm: number | null;
  depth_mm: number | null;
  height_mm: number | null;
  max_load_kg: number | null;
  power_capacity_w: number | null;
  network_port_count: number | null;
  utilities: any;
  compatible_bench_types: number[];
  is_occupied: boolean;
  created_at: string;
  updated_at: string;
};
export type StationSlotListSerializersStationSlotPaginatedResponse = {
  meta: StationSlotListSerializersStationSlotPaginationMeta;
  data: StationSlot[];
};
export type StationSlotListSerializersStationSlotPaginatedResponseRead = {
  meta: StationSlotListSerializersStationSlotPaginationMeta;
  data: StationSlotRead[];
};
export type StationSlotCreateSerializersStationSlotDetailResponse = {
  data: StationSlot;
};
export type StationSlotCreateSerializersStationSlotDetailResponseRead = {
  data: StationSlotRead;
};
export type LegacyStationSlotStatusEnum =
  | "available"
  | "in_service"
  | "maintenance"
  | "occupied"
  | "out_of_service"
  | "reserved"
  | "retired";
export type StationSlotStatusEnum = "in_service" | "out_of_service" | "retired";
export type StationSlotCreate = {
  position_index: number;
  slot_code: string;
  label?: string;
  /** Deprecated: use service_status. */
  is_active?: boolean;
  /** Deprecated: use service_status.
    
    * `available` - available
    * `in_service` - in_service
    * `maintenance` - maintenance
    * `occupied` - occupied
    * `out_of_service` - out_of_service
    * `reserved` - reserved
    * `retired` - retired */
  status?: LegacyStationSlotStatusEnum;
  service_status?: StationSlotStatusEnum;
  width_mm?: number | null;
  depth_mm?: number | null;
  height_mm?: number | null;
  max_load_kg?: number | null;
  power_capacity_w?: number | null;
  network_port_count?: number | null;
  utilities?: {
    [key: string]: any;
  };
  compatible_bench_types?: number[];
};
export type StationSlotDetailSerializersStationSlotDetailResponse = {
  data: StationSlot;
};
export type StationSlotDetailSerializersStationSlotDetailResponseRead = {
  data: StationSlotRead;
};
export type StationSlotReplaceSerializersStationSlotDetailResponse = {
  data: StationSlot;
};
export type StationSlotReplaceSerializersStationSlotDetailResponseRead = {
  data: StationSlotRead;
};
export type StationSlotUpdate = {
  position_index?: number;
  slot_code?: string;
  label?: string;
  /** Deprecated: use service_status. */
  is_active?: boolean;
  /** Deprecated: use service_status.
    
    * `available` - available
    * `in_service` - in_service
    * `maintenance` - maintenance
    * `occupied` - occupied
    * `out_of_service` - out_of_service
    * `reserved` - reserved
    * `retired` - retired */
  status?: LegacyStationSlotStatusEnum;
  service_status?: StationSlotStatusEnum;
  width_mm?: number | null;
  depth_mm?: number | null;
  height_mm?: number | null;
  max_load_kg?: number | null;
  power_capacity_w?: number | null;
  network_port_count?: number | null;
  utilities?: {
    [key: string]: any;
  };
  compatible_bench_types?: number[];
};
export type StationSlotUpdateSerializersStationSlotDetailResponse = {
  data: StationSlot;
};
export type StationSlotUpdateSerializersStationSlotDetailResponseRead = {
  data: StationSlotRead;
};
export type PatchedStationSlotUpdate = {
  position_index?: number;
  slot_code?: string;
  label?: string;
  /** Deprecated: use service_status. */
  is_active?: boolean;
  /** Deprecated: use service_status.
    
    * `available` - available
    * `in_service` - in_service
    * `maintenance` - maintenance
    * `occupied` - occupied
    * `out_of_service` - out_of_service
    * `reserved` - reserved
    * `retired` - retired */
  status?: LegacyStationSlotStatusEnum;
  service_status?: StationSlotStatusEnum;
  width_mm?: number | null;
  depth_mm?: number | null;
  height_mm?: number | null;
  max_load_kg?: number | null;
  power_capacity_w?: number | null;
  network_port_count?: number | null;
  utilities?: {
    [key: string]: any;
  };
  compatible_bench_types?: number[];
};
export type StationFiltersFilteringFilterMetadataDetailResponse = {
  data: FilterMetadata;
};
export type StationReferenceData = {};
export type LabsStationRoomReference = {};
export type LabsStationRoomReferenceRead = {
  id: number;
  name: string;
  sku: string;
};
export type StationReferenceDataRead = {
  types: StationTypeRead[];
  bench_types: LabsNamedReferenceRead[];
  rooms: LabsStationRoomReferenceRead[];
  /** Deprecated seven-value status. */
  statuses: LabsChoiceReferenceRead[];
  lifecycle_statuses: LabsChoiceReferenceRead[];
  access_policies: LabsChoiceReferenceRead[];
  /** Slot service_status values. */
  slot_statuses: LabsChoiceReferenceRead[];
};
export type StationReferenceDataSerializersStationReferenceDataDetailResponse =
  {
    data: StationReferenceData;
  };
export type StationReferenceDataSerializersStationReferenceDataDetailResponseRead =
  {
    data: StationReferenceDataRead;
  };
export type StationStatusSummary = {
  total_count: number;
  /** Resources without a recorded status or with an unrecognized status. */
  unknown_status_count: number;
  /** All code-defined states, including zero counts. Values are extensible. */
  statuses: SummaryStatusCount[];
};
export type StationStatusSummaryDataSerializersStationStatusSummaryDetailResponse =
  {
    data: StationStatusSummary;
  };
export type SheetOutcome = {
  key: string;
  name: string;
  /** Non-empty data rows read. */
  rows: number;
  /** Rows that create a record (or would, for a check). */
  created: number;
  /** Rows that change an existing record (upsert mode only). */
  updated: number;
  /** Rows that match an existing record and change nothing (reference rows; unchanged rows in upsert). */
  existing: number;
  failed: number;
  ignored_columns: string[];
};
export type ImportProblem = {
  /** Sheet name as in the workbook. */
  sheet: string;
  /** Excel row number; null for a sheet-level problem. */
  row: number | null;
  /** Column name as in the template; null when general. */
  column: string | null;
  /** Stable snake_case problem code. */
  code: string;
  message: string;
};
export type ImportProblemRead = {
  /** Sheet name as in the workbook. */
  sheet: string;
  /** Excel row number; null for a sheet-level problem. */
  row: number | null;
  /** Column name as in the template; null when general. */
  column: string | null;
  severity: ChoiceRead;
  /** Stable snake_case problem code. */
  code: string;
  message: string;
};
export type ImportReport = {
  /** True for a check: nothing was saved. */
  is_dry_run: boolean;
  /** True when the workbook has no errors and can be applied. */
  is_valid: boolean;
  template_version: string | null;
  sheets: SheetOutcome[];
  problems: ImportProblem[];
  /** Sheets that were not read. */
  unknown_sheets: string[];
};
export type ImportSummary = {
  created: number;
  updated: number;
  existing: number;
  error_count: number;
  warning_count: number;
};
export type ImportReportRead = {
  /** True for a check: nothing was saved. */
  is_dry_run: boolean;
  /** True when the workbook has no errors and can be applied. */
  is_valid: boolean;
  template_version: string | null;
  mode: ChoiceRead;
  summary: ImportSummary;
  sheets: SheetOutcome[];
  problems: ImportProblemRead[];
  /** Sheets that were not read. */
  unknown_sheets: string[];
};
export type WorkbookImportApplySerializersImportReportDetailResponse = {
  data: ImportReport;
};
export type WorkbookImportApplySerializersImportReportDetailResponseRead = {
  data: ImportReportRead;
};
export type WorkbookImportModeEnum = "create" | "upsert";
export type WorkbookUpload = {
  /** The data workbook (.xlsx), at most 10 MB and 5,000 rows per sheet. */
  file: Blob;
  /** create (default): an existing asset tag is an error. upsert: an existing asset tag updates that record; blank cells keep stored values; the asset tag never changes.
    
    * `create` - Create new
    * `upsert` - Update existing */
  mode?: WorkbookImportModeEnum;
};
export type WorkbookImportCheckSerializersImportReportDetailResponse = {
  data: ImportReport;
};
export type WorkbookImportCheckSerializersImportReportDetailResponseRead = {
  data: ImportReportRead;
};
export type LoginResponse = {
  username: string;
  access: string;
  is_active: boolean;
};
export type LoginSerializerLoginResponseDetailResponse = {
  data: LoginResponse;
};
export type Login = {
  username: string;
};
export type LoginWrite = {
  username: string;
  password: string;
};
export type NotificationSerializerNotificationPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type NotificationSerializerNotificationPaginationMeta = {
  pagination: NotificationSerializerNotificationPagination;
};
export type Notification = {};
export type NotificationRead = {
  id: number;
  message: string;
  details: string | null;
  message_type: ChoiceRead;
  expires_at: string;
  target_user: UserReferenceRead | null;
  created_at: string;
  updated_at: string;
};
export type NotificationSerializerNotificationPaginatedResponse = {
  meta: NotificationSerializerNotificationPaginationMeta;
  data: Notification[];
};
export type NotificationSerializerNotificationPaginatedResponseRead = {
  meta: NotificationSerializerNotificationPaginationMeta;
  data: NotificationRead[];
};
export type NotificationSerializerNotificationDetailResponse = {
  data: Notification;
};
export type NotificationSerializerNotificationDetailResponseRead = {
  data: NotificationRead;
};
export type MessageTypeEnum =
  "success" | "error" | "warning" | "info" | "announcement";
export type NotificationWrite = {
  message?: string;
  details?: string | null;
  message_type?: MessageTypeEnum;
  expires_at: string;
};
export type RefreshTokenResponse = {
  access: string;
};
export type RefreshTokenSerializerRefreshTokenResponseDetailResponse = {
  data: RefreshTokenResponse;
};
export type SendOtpResponse = {
  message: string;
};
export type SendOtpSerializerSendOtpResponseDetailResponse = {
  data: SendOtpResponse;
};
export type SendOtp = {
  username: string;
  otp: string;
};
export type CannedResponse = {
  title: string;
  body: string;
  is_active?: boolean;
};
export type TeamSummary = {
  name: string;
};
export type TeamSummaryRead = {
  id: number;
  name: string;
};
export type CannedResponseRead = {
  id: number;
  title: string;
  body: string;
  team: TeamSummaryRead | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};
export type AdminCannedResponseListSerializersCannedResponseListResponse = {
  data: CannedResponse[];
};
export type AdminCannedResponseListSerializersCannedResponseListResponseRead = {
  data: CannedResponseRead[];
};
export type AdminCannedResponseCreateSerializersCannedResponseDetailResponse = {
  data: CannedResponse;
};
export type AdminCannedResponseCreateSerializersCannedResponseDetailResponseRead =
  {
    data: CannedResponseRead;
  };
export type AdminCannedResponseCreate = {
  title: string;
  body: string;
  team_id?: number | null;
  is_active?: boolean;
};
export type AdminCannedResponseUpdateSerializersCannedResponseDetailResponse = {
  data: CannedResponse;
};
export type AdminCannedResponseUpdateSerializersCannedResponseDetailResponseRead =
  {
    data: CannedResponseRead;
  };
export type PatchedAdminCannedResponseUpdate = {
  title?: string;
  body?: string;
  team_id?: number;
  clear_team?: boolean;
  is_active?: boolean;
};
export type SupportSettings = {
  /** Days after resolution during which a requester may reopen a ticket. */
  reopen_window_days?: number;
  /** Days after resolution before auto-closing a ticket (0 to disable). */
  auto_close_days?: number;
  /** Maximum allowed attachment size in bytes (default 25 MB). */
  max_attachment_size_bytes?: number;
  /** List of permitted file extensions with dots, e.g. ['.png', '.pdf']. */
  allowed_attachment_extensions?: any;
  /** Maximum number of attachments allowed on a single ticket. */
  max_attachments_per_ticket?: number;
  /** Minutes after creation during which an author may edit/delete their comment. */
  comment_edit_window_minutes?: number;
  /** A ticket is 'at risk' once this percentage of its SLA window has elapsed. */
  sla_at_risk_percent?: number;
  /** Days after resolution during which the requester can submit a satisfaction rating. */
  csat_window_days?: number;
};
export type SupportSettingsRead = {
  /** Days after resolution during which a requester may reopen a ticket. */
  reopen_window_days?: number;
  /** Days after resolution before auto-closing a ticket (0 to disable). */
  auto_close_days?: number;
  /** Maximum allowed attachment size in bytes (default 25 MB). */
  max_attachment_size_bytes?: number;
  /** List of permitted file extensions with dots, e.g. ['.png', '.pdf']. */
  allowed_attachment_extensions?: any;
  /** Maximum number of attachments allowed on a single ticket. */
  max_attachments_per_ticket?: number;
  /** Minutes after creation during which an author may edit/delete their comment. */
  comment_edit_window_minutes?: number;
  can_requesters_set_priority: boolean;
  is_sla_enabled: boolean;
  /** A ticket is 'at risk' once this percentage of its SLA window has elapsed. */
  sla_at_risk_percent?: number;
  is_csat_enabled: boolean;
  /** Days after resolution during which the requester can submit a satisfaction rating. */
  csat_window_days?: number;
  default_ticket_type: ChoiceRead;
  updated_at: string;
};
export type AdminSettingsDetailSerializersSupportSettingsDetailResponse = {
  data: SupportSettings;
};
export type AdminSettingsDetailSerializersSupportSettingsDetailResponseRead = {
  data: SupportSettingsRead;
};
export type AdminSettingsUpdateSerializersSupportSettingsDetailResponse = {
  data: SupportSettings;
};
export type AdminSettingsUpdateSerializersSupportSettingsDetailResponseRead = {
  data: SupportSettingsRead;
};
export type TicketTypeEnum =
  "incident" | "service_request" | "problem" | "change" | "question";
export type PatchedAdminSettingsUpdate = {
  reopen_window_days?: number;
  auto_close_days?: number;
  max_attachment_size_bytes?: number;
  allowed_attachment_extensions?: string[];
  max_attachments_per_ticket?: number;
  comment_edit_window_minutes?: number;
  can_requesters_set_priority?: boolean;
  is_sla_enabled?: boolean;
  sla_at_risk_percent?: number;
  is_csat_enabled?: boolean;
  csat_window_days?: number;
  default_ticket_type?: TicketTypeEnum;
};
export type StatusTransition = {
  /** List of roles allowed to trigger this transition, e.g. ['agent', 'admin']. */
  allowed_roles?: any;
};
export type Relation = {};
export type RelationRead = {
  id: number;
  name: string;
};
export type StatusTransitionRead = {
  id: number;
  from_status: RelationRead;
  to_status: RelationRead;
  /** List of roles allowed to trigger this transition, e.g. ['agent', 'admin']. */
  allowed_roles?: any;
  is_reason_required: boolean;
  is_resolution_required: boolean;
  created_at: string;
};
export type StatusTransitionWrite = {
  from_status_id: number;
  to_status_id: number;
  /** List of roles allowed to trigger this transition, e.g. ['agent', 'admin']. */
  allowed_roles?: any;
};
export type AdminTransitionListSerializersStatusTransitionListResponse = {
  data: StatusTransition[];
};
export type AdminTransitionListSerializersStatusTransitionListResponseRead = {
  data: StatusTransitionRead[];
};
export type AdminTransitionListSerializersStatusTransitionListResponseWrite = {
  data: StatusTransitionWrite[];
};
export type AdminTransitionCreateSerializersStatusTransitionDetailResponse = {
  data: StatusTransition;
};
export type AdminTransitionCreateSerializersStatusTransitionDetailResponseRead =
  {
    data: StatusTransitionRead;
  };
export type AdminTransitionCreateSerializersStatusTransitionDetailResponseWrite =
  {
    data: StatusTransitionWrite;
  };
export type AdminTransitionCreate = {
  from_status_id: number;
  to_status_id: number;
  allowed_roles?: string[];
  is_reason_required?: boolean;
  is_resolution_required?: boolean;
};
export type AdminTransitionUpdateSerializersStatusTransitionDetailResponse = {
  data: StatusTransition;
};
export type AdminTransitionUpdateSerializersStatusTransitionDetailResponseRead =
  {
    data: StatusTransitionRead;
  };
export type AdminTransitionUpdateSerializersStatusTransitionDetailResponseWrite =
  {
    data: StatusTransitionWrite;
  };
export type PatchedAdminTransitionUpdate = {
  allowed_roles?: string[];
  is_reason_required?: boolean;
  is_resolution_required?: boolean;
};
export type CannedResponseListSerializersCannedResponseListResponse = {
  data: CannedResponse[];
};
export type CannedResponseListSerializersCannedResponseListResponseRead = {
  data: CannedResponseRead[];
};
export type Category = {
  name: string;
  /** Stable machine-readable identifier (exposed as 'sku' by the options API). */
  code?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
};
export type CategoryRead = {
  id: number;
  name: string;
  /** Stable machine-readable identifier (exposed as 'sku' by the options API). */
  code?: string;
  description?: string;
  default_team: TeamSummaryRead | null;
  sort_order?: number;
  is_active?: boolean;
  created_at: string;
};
export type AdminCategoryListSerializersCategoryListResponse = {
  data: Category[];
};
export type AdminCategoryListSerializersCategoryListResponseRead = {
  data: CategoryRead[];
};
export type AdminCategoryCreateSerializersCategoryDetailResponse = {
  data: Category;
};
export type AdminCategoryCreateSerializersCategoryDetailResponseRead = {
  data: CategoryRead;
};
export type AdminCategoryCreate = {
  name: string;
  code?: string;
  default_team_id?: number | null;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
};
export type AdminCategoryUpdateSerializersCategoryDetailResponse = {
  data: Category;
};
export type AdminCategoryUpdateSerializersCategoryDetailResponseRead = {
  data: CategoryRead;
};
export type PatchedAdminCategoryUpdate = {
  name?: string;
  code?: string;
  default_team_id?: number;
  clear_default_team?: boolean;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
};
export type Label = {
  name: string;
  /** Optional '#RRGGBB' badge colour. */
  color_hex?: string;
};
export type LabelRead = {
  id: number;
  name: string;
  /** Optional '#RRGGBB' badge colour. */
  color_hex?: string;
};
export type AdminLabelListSerializersLabelListResponse = {
  data: Label[];
};
export type AdminLabelListSerializersLabelListResponseRead = {
  data: LabelRead[];
};
export type AdminLabelCreateSerializersLabelDetailResponse = {
  data: Label;
};
export type AdminLabelCreateSerializersLabelDetailResponseRead = {
  data: LabelRead;
};
export type AdminLabelCreate = {
  name: string;
  color_hex?: string;
};
export type AdminLabelUpdateSerializersLabelDetailResponse = {
  data: Label;
};
export type AdminLabelUpdateSerializersLabelDetailResponseRead = {
  data: LabelRead;
};
export type PatchedAdminLabelUpdate = {
  name?: string;
  color_hex?: string;
};
export type Priority = {
  name: string;
  /** Stable machine-readable identifier. */
  code?: string;
  /** Lower rank indicates higher urgency (1=Critical) */
  rank: number;
  /** Optional '#RRGGBB' badge colour. */
  color_hex?: string;
  /** SLA: minutes allowed until the first agent response (empty = no target). */
  response_target_minutes?: number | null;
  /** SLA: minutes allowed until the ticket is resolved (empty = no target). */
  resolution_target_minutes?: number | null;
  is_default?: boolean;
  is_active?: boolean;
};
export type PriorityRead = {
  id: number;
  name: string;
  /** Stable machine-readable identifier. */
  code?: string;
  /** Lower rank indicates higher urgency (1=Critical) */
  rank: number;
  /** Optional '#RRGGBB' badge colour. */
  color_hex?: string;
  /** SLA: minutes allowed until the first agent response (empty = no target). */
  response_target_minutes?: number | null;
  /** SLA: minutes allowed until the ticket is resolved (empty = no target). */
  resolution_target_minutes?: number | null;
  is_default?: boolean;
  is_active?: boolean;
  created_at: string;
};
export type AdminPriorityListSerializersPriorityListResponse = {
  data: Priority[];
};
export type AdminPriorityListSerializersPriorityListResponseRead = {
  data: PriorityRead[];
};
export type AdminPriorityCreateSerializersPriorityDetailResponse = {
  data: Priority;
};
export type AdminPriorityCreateSerializersPriorityDetailResponseRead = {
  data: PriorityRead;
};
export type AdminPriorityCreate = {
  name: string;
  rank: number;
  code?: string;
  color_hex?: string;
  response_target_minutes?: number | null;
  resolution_target_minutes?: number | null;
  is_default?: boolean;
  is_active?: boolean;
};
export type AdminPriorityUpdateSerializersPriorityDetailResponse = {
  data: Priority;
};
export type AdminPriorityUpdateSerializersPriorityDetailResponseRead = {
  data: PriorityRead;
};
export type PatchedAdminPriorityUpdate = {
  name?: string;
  rank?: number;
  code?: string;
  color_hex?: string;
  response_target_minutes?: number;
  resolution_target_minutes?: number;
  clear_response_target?: boolean;
  clear_resolution_target?: boolean;
  is_default?: boolean;
  is_active?: boolean;
};
export type ResourceTicketDtoItem = {
  id: number;
  key: string;
  subject: string;
  status_name: string;
  priority_name: string;
  priority_rank: number;
  created_at: string;
  is_link_active: boolean;
};
export type ResourceTicketDtoItemRead = {
  id: number;
  key: string;
  subject: string;
  status_name: string;
  system_state: ChoiceRead;
  priority_name: string;
  priority_rank: number;
  created_at: string;
  is_link_active: boolean;
};
export type ResourceTicketSummary = {
  open_count: number;
  total_count: number;
  tickets: ResourceTicketDtoItem[];
};
export type ResourceTicketSummaryRead = {
  open_count: number;
  total_count: number;
  tickets: ResourceTicketDtoItemRead[];
};
export type ResourceTicketSummarySerializersResourceTicketSummaryDetailResponse =
  {
    data: ResourceTicketSummary;
  };
export type ResourceTicketSummarySerializersResourceTicketSummaryDetailResponseRead =
  {
    data: ResourceTicketSummaryRead;
  };
export type Status = {
  name: string;
  /** Optional '#RRGGBB' badge colour. */
  color_hex?: string;
  is_initial?: boolean;
  /** Terminal status (e.g. Closed). Entering it stamps closed_at; auto-close moves tickets here. */
  is_final?: boolean;
  sort_order?: number;
  is_active?: boolean;
};
export type StatusRead = {
  id: number;
  name: string;
  system_state: ChoiceRead;
  /** Optional '#RRGGBB' badge colour. */
  color_hex?: string;
  is_initial?: boolean;
  /** Terminal status (e.g. Closed). Entering it stamps closed_at; auto-close moves tickets here. */
  is_final?: boolean;
  is_sla_paused: boolean;
  sort_order?: number;
  is_active?: boolean;
  created_at: string;
};
export type AdminStatusListSerializersStatusListResponse = {
  data: Status[];
};
export type AdminStatusListSerializersStatusListResponseRead = {
  data: StatusRead[];
};
export type AdminStatusCreateSerializersStatusDetailResponse = {
  data: Status;
};
export type AdminStatusCreateSerializersStatusDetailResponseRead = {
  data: StatusRead;
};
export type SystemStateEnum = "open" | "active" | "waiting" | "done";
export type AdminStatusCreate = {
  name: string;
  color_hex?: string;
  is_final?: boolean;
  is_sla_paused?: boolean;
  system_state: SystemStateEnum;
  is_initial?: boolean;
  is_active?: boolean;
  sort_order?: number;
};
export type AdminStatusUpdateSerializersStatusDetailResponse = {
  data: Status;
};
export type AdminStatusUpdateSerializersStatusDetailResponseRead = {
  data: StatusRead;
};
export type PatchedAdminStatusUpdate = {
  name?: string;
  color_hex?: string;
  is_final?: boolean;
  is_sla_paused?: boolean;
  system_state?: SystemStateEnum;
  is_initial?: boolean;
  is_active?: boolean;
  sort_order?: number;
};
export type Team = {
  name: string;
  /** Stable machine-readable identifier used by the options API. */
  code: string;
  description?: string;
  is_active?: boolean;
};
export type TeamRead = {
  id: number;
  name: string;
  /** Stable machine-readable identifier used by the options API. */
  code: string;
  description?: string;
  lead: UserReferenceRead | null;
  members: UserReferenceRead[];
  is_active?: boolean;
  created_at: string;
};
export type AdminTeamListSerializersTeamListResponse = {
  data: Team[];
};
export type AdminTeamListSerializersTeamListResponseRead = {
  data: TeamRead[];
};
export type AdminTeamCreateSerializersTeamDetailResponse = {
  data: Team;
};
export type AdminTeamCreateSerializersTeamDetailResponseRead = {
  data: TeamRead;
};
export type AdminTeamCreate = {
  name: string;
  code?: string;
  description?: string;
  lead_id?: number | null;
  member_ids?: number[];
  is_active?: boolean;
};
export type AdminTeamUpdateSerializersTeamDetailResponse = {
  data: Team;
};
export type AdminTeamUpdateSerializersTeamDetailResponseRead = {
  data: TeamRead;
};
export type PatchedAdminTeamUpdate = {
  name?: string;
  code?: string;
  description?: string;
  lead_id?: number;
  clear_lead?: boolean;
  member_ids?: number[];
  is_active?: boolean;
};
export type TicketListSerializersTicketListPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type TicketListSerializersTicketListPaginationMeta = {
  pagination: TicketListSerializersTicketListPagination;
};
export type UrgencyEnum = "1" | "2" | "3";
export type BlankEnum = "";
export type TicketList = {
  subject: string;
  impact?: UrgencyEnum | BlankEnum;
  urgency?: UrgencyEnum | BlankEnum;
  /** Requester/agent-set target date, independent of the SLA. */
  due_date?: string | null;
  last_activity_at?: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  version?: number;
};
export type TicketListRead = {
  id: number;
  key: string;
  number: number;
  subject: string;
  ticket_type: ChoiceRead;
  source: ChoiceRead;
  impact?: UrgencyEnum | BlankEnum;
  urgency?: UrgencyEnum | BlankEnum;
  category: RelationRead | null;
  priority: RelationRead | null;
  status: RelationRead;
  requester: UserReferenceRead;
  assignee: UserReferenceRead | null;
  team: TeamSummaryRead | null;
  labels: string[];
  /** Requester/agent-set target date, independent of the SLA. */
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  sla: {
    [key: string]: any;
  };
  version?: number;
};
export type TicketListSerializersTicketListPaginatedResponse = {
  meta: TicketListSerializersTicketListPaginationMeta;
  data: TicketList[];
};
export type TicketListSerializersTicketListPaginatedResponseRead = {
  meta: TicketListSerializersTicketListPaginationMeta;
  data: TicketListRead[];
};
export type ResolutionCodeEnum =
  | "fixed"
  | "workaround"
  | "cannot_reproduce"
  | "duplicate"
  | "wont_fix"
  | "user_error"
  | "vendor";
export type TicketDetail = {
  subject: string;
  description: string;
  impact?: UrgencyEnum | BlankEnum;
  urgency?: UrgencyEnum | BlankEnum;
  /** Reference in an external system (vendor RMA / case number, legacy Jira key...). */
  external_reference?: string;
  /** Requester/agent-set target date, independent of the SLA. */
  due_date?: string | null;
  last_activity_at?: string;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  reopen_count?: number;
  resolution_code?: ResolutionCodeEnum | BlankEnum;
  resolution_summary?: string;
  root_cause?: string;
  csat_score?: number | null;
  csat_comment?: string;
  csat_submitted_at?: string | null;
  version?: number;
};
export type TicketRef = {};
export type TicketRefRead = {
  id: number;
  name: string;
};
export type Watcher = {};
export type WatcherRead = {
  user: UserReferenceRead;
  created_at: string;
};
export type TicketResourceLink = {
  is_active?: boolean;
  unlinked_at?: string | null;
  unlink_reason?: string;
};
export type LinkedResource = {};
export type ResourceTypeEnum =
  "room" | "station" | "bench" | "equipment" | "license";
export type LinkedResourceRead = {
  id: string;
  name: string;
  type: ResourceTypeEnum;
};
export type TicketResourceLinkRead = {
  id: number;
  resource: LinkedResourceRead;
  snapshot: {
    [key: string]: any;
  };
  is_active?: boolean;
  linked_at: string;
  linked_by: UserReferenceRead;
  unlinked_at?: string | null;
  unlinked_by: UserReferenceRead | null;
  unlink_reason?: string;
  badge: string;
};
export type TicketDetailRead = {
  id: number;
  key: string;
  number: number;
  subject: string;
  description: string;
  ticket_type: ChoiceRead;
  source: ChoiceRead;
  impact?: UrgencyEnum | BlankEnum;
  urgency?: UrgencyEnum | BlankEnum;
  /** Reference in an external system (vendor RMA / case number, legacy Jira key...). */
  external_reference?: string;
  /** Requester/agent-set target date, independent of the SLA. */
  due_date?: string | null;
  category: RelationRead | null;
  priority: RelationRead | null;
  status: RelationRead;
  requester: UserReferenceRead;
  created_by: UserReferenceRead;
  assignee: UserReferenceRead | null;
  team: TeamSummaryRead | null;
  labels: string[];
  parent: TicketRefRead | null;
  children: TicketRefRead[];
  ticket_links: {
    [key: string]: any;
  }[];
  watchers: WatcherRead[];
  is_watching: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  resolved_by: UserReferenceRead | null;
  reopen_count?: number;
  resolution_code?: ResolutionCodeEnum | BlankEnum;
  resolution_summary?: string;
  root_cause?: string;
  csat_score?: number | null;
  csat_comment?: string;
  csat_submitted_at?: string | null;
  sla: {
    [key: string]: any;
  };
  version?: number;
  resource_links: TicketResourceLinkRead[];
  comments: {
    [key: string]: any;
  }[];
  attachments: {
    [key: string]: any;
  }[];
  activities: {
    [key: string]: any;
  }[];
};
export type TicketCreateSerializersTicketDetailDetailResponse = {
  data: TicketDetail;
};
export type TicketCreateSerializersTicketDetailDetailResponseRead = {
  data: TicketDetailRead;
};
export type SourceEnum = "web" | "email" | "phone" | "walk_in" | "api";
export type LinkedResourceItem = {
  resource_type: ResourceTypeEnum;
  resource_id: string;
};
export type TicketCreateRequest = {
  subject: string;
  description: string;
  category_id: number;
  /** Optional: derived from impact/urgency, then the default priority, when omitted. */
  priority_id?: number | null;
  ticket_type?: TicketTypeEnum;
  impact?: UrgencyEnum | BlankEnum;
  urgency?: UrgencyEnum | BlankEnum;
  source?: SourceEnum;
  external_reference?: string;
  due_date?: string | null;
  team_id?: number | null;
  labels?: string[];
  parent_key?: string | null;
  watcher_ids?: number[];
  linked_resources?: LinkedResourceItem[];
  assignee_id?: number | null;
  on_behalf_of_id?: number | null;
  idempotency_key?: string | null;
};
export type TicketDetailSerializersTicketDetailDetailResponse = {
  data: TicketDetail;
};
export type TicketDetailSerializersTicketDetailDetailResponseRead = {
  data: TicketDetailRead;
};
export type TicketUpdateSerializersTicketDetailDetailResponse = {
  data: TicketDetail;
};
export type TicketUpdateSerializersTicketDetailDetailResponseRead = {
  data: TicketDetailRead;
};
export type PatchedTicketUpdateRequest = {
  version?: number;
  subject?: string;
  description?: string;
  category_id?: number;
  priority_id?: number;
  ticket_type?: TicketTypeEnum;
  impact?: UrgencyEnum | BlankEnum;
  urgency?: UrgencyEnum | BlankEnum;
  external_reference?: string;
  due_date?: string | null;
  team_id?: number | null;
  labels?: string[];
  parent_key?: string | null;
};
export type TicketAssignSerializersTicketDetailDetailResponse = {
  data: TicketDetail;
};
export type TicketAssignSerializersTicketDetailDetailResponseRead = {
  data: TicketDetailRead;
};
export type TicketAssignRequest = {
  assignee_id: number | null;
  version?: number | null;
};
export type TicketCsatSerializersTicketDetailDetailResponse = {
  data: TicketDetail;
};
export type TicketCsatSerializersTicketDetailDetailResponseRead = {
  data: TicketDetailRead;
};
export type CsatRequest = {
  score: number;
  comment?: string;
};
export type TicketTransitionSerializersTicketDetailDetailResponse = {
  data: TicketDetail;
};
export type TicketTransitionSerializersTicketDetailDetailResponseRead = {
  data: TicketDetailRead;
};
export type TicketTransitionRequest = {
  to_status_id: number;
  version: number;
  reason?: string;
  resolution_summary?: string;
  root_cause?: string;
  resolution_code?: ResolutionCodeEnum | BlankEnum;
};
export type TicketActivity = {
  actor_name: string;
  payload?: any;
};
export type TicketActivityRead = {
  id: number;
  event_type: ChoiceRead;
  actor_name: string;
  occurred_at: string;
  payload?: any;
  correlation_key: string;
};
export type TicketActivityListSerializersTicketActivityListResponse = {
  data: TicketActivity[];
};
export type TicketActivityListSerializersTicketActivityListResponseRead = {
  data: TicketActivityRead[];
};
export type TicketAttachment = {
  filename: string;
  content_type: string;
  size: number;
  /** Restricted attachments are visible only to support agents and administrators. */
  is_restricted?: boolean;
};
export type TicketAttachmentRead = {
  id: number;
  filename: string;
  content_type: string;
  size: number;
  /** Restricted attachments are visible only to support agents and administrators. */
  is_restricted?: boolean;
  scan_status: ChoiceRead;
  created_at: string;
  uploaded_by: UserReferenceRead;
  download_url: string;
};
export type TicketAttachmentCreateSerializersTicketAttachmentDetailResponse = {
  data: TicketAttachment;
};
export type TicketAttachmentCreateSerializersTicketAttachmentDetailResponseRead =
  {
    data: TicketAttachmentRead;
  };
export type AttachmentUploadRequest = {
  file: string;
  comment_id?: number | null;
  is_restricted?: boolean;
};
export type TicketComment = {
  body: string;
  edited_at?: string | null;
};
export type TicketCommentRead = {
  id: number;
  author: UserReferenceRead;
  body: string;
  visibility: ChoiceRead;
  created_at: string;
  edited_at?: string | null;
};
export type TicketCommentListSerializersTicketCommentListResponse = {
  data: TicketComment[];
};
export type TicketCommentListSerializersTicketCommentListResponseRead = {
  data: TicketCommentRead[];
};
export type TicketCommentCreateSerializersTicketCommentDetailResponse = {
  data: TicketComment;
};
export type TicketCommentCreateSerializersTicketCommentDetailResponseRead = {
  data: TicketCommentRead;
};
export type VisibilityEnum = "public" | "internal";
export type CommentCreateRequest = {
  body: string;
  visibility?: VisibilityEnum;
};
export type TicketCommentUpdateSerializersTicketCommentDetailResponse = {
  data: TicketComment;
};
export type TicketCommentUpdateSerializersTicketCommentDetailResponseRead = {
  data: TicketCommentRead;
};
export type PatchedCommentUpdateRequest = {
  body?: string;
};
export type TicketLink = {};
export type TicketLinkRead = {
  id: number;
  link_type: ChoiceRead;
  direction: string;
  label: string;
  ticket: TicketRefRead;
  created_at: string;
};
export type TicketLinkListSerializersTicketLinkListResponse = {
  data: TicketLink[];
};
export type TicketLinkListSerializersTicketLinkListResponseRead = {
  data: TicketLinkRead[];
};
export type TicketLinkCreateSerializersTicketLinkDetailResponse = {
  data: TicketLink;
};
export type TicketLinkCreateSerializersTicketLinkDetailResponseRead = {
  data: TicketLinkRead;
};
export type LinkTypeEnum = "relates_to" | "duplicates" | "blocks" | "caused_by";
export type TicketLinkRequest = {
  target_key: string;
  link_type: LinkTypeEnum;
};
export type TicketResourceLinkCreateSerializersTicketResourceLinkDetailResponse =
  {
    data: TicketResourceLink;
  };
export type TicketResourceLinkCreateSerializersTicketResourceLinkDetailResponseRead =
  {
    data: TicketResourceLinkRead;
  };
export type LinkResourceRequest = {
  resource_type: ResourceTypeEnum;
  resource_id: string;
};
export type TicketWatcherAddSerializersWatcherDetailResponse = {
  data: Watcher;
};
export type TicketWatcherAddSerializersWatcherDetailResponseRead = {
  data: WatcherRead;
};
export type WatcherRequest = {
  /** Defaults to the caller. */
  user_id?: number | null;
};
export type QueueStatsPriorityItem = {
  /** Rank of the priority for ordering. */
  rank: number;
  /** Number of open tickets with this priority. */
  count: number;
};
export type QueueStatsPriorityItemRead = {
  /** The support priority (REL-14). */
  priority: RelationRead;
  /** Rank of the priority for ordering. */
  rank: number;
  /** Number of open tickets with this priority. */
  count: number;
};
export type QueueStatsTeamItem = {
  /** Number of open tickets assigned to this team. */
  count: number;
};
export type QueueStatsTeamItemRead = {
  /** The support team, or null if unassigned (REL-14). */
  team: RelationRead | null;
  /** Number of open tickets assigned to this team. */
  count: number;
};
export type QueueStatsAssigneeItem = {
  /** Number of open tickets assigned to this user. */
  count: number;
};
export type QueueStatsAssigneeItemRead = {
  /** The assigned user (REL-14). */
  assignee: UserReferenceRead;
  /** Number of open tickets assigned to this user. */
  count: number;
};
export type QueueStatsSla = {
  /** Count of tickets that breached response SLA. */
  response_breached: number;
  /** Count of tickets that breached resolution SLA. */
  resolution_breached: number;
  /** Count of open tickets overdue for resolution. */
  overdue_resolution: number;
  /** Count of tickets currently in SLA pause. */
  paused: number;
};
export type QueueStats = {
  /** Window in days used for recent throughput metrics. */
  window_days: number;
  /** Total number of active, non-done tickets. */
  open_total: number;
  /** Total number of tickets without an assignee. */
  unassigned: number;
  /** Total number of open tickets assigned to the calling agent. */
  mine_open: number;
  /** Ticket count grouped by system state. */
  by_state: {
    [key: string]: number;
  };
  /** Open ticket count grouped by ticket type. */
  by_type: {
    [key: string]: number;
  };
  /** Breakdown of open tickets by priority. */
  by_priority: QueueStatsPriorityItem[];
  /** Breakdown of open tickets by team. */
  by_team: QueueStatsTeamItem[];
  /** Breakdown of open tickets by assignee (top 20). */
  by_assignee: QueueStatsAssigneeItem[];
  /** Current SLA breach and pause counters. */
  sla: QueueStatsSla;
  /** Total tickets created within the window. */
  created: number;
  /** Total tickets resolved within the window. */
  resolved: number;
  /** Total tickets reopened within the window. */
  reopened: number;
  /** Average first response time in minutes. */
  avg_first_response_minutes: number | null;
  /** Average resolution time in minutes. */
  avg_resolution_minutes: number | null;
  /** Average CSAT rating within the window (1.0 to 5.0). */
  csat_average: number | null;
  /** Number of CSAT ratings submitted within the window. */
  csat_responses: number;
};
export type QueueStatsRead = {
  /** Window in days used for recent throughput metrics. */
  window_days: number;
  /** Total number of active, non-done tickets. */
  open_total: number;
  /** Total number of tickets without an assignee. */
  unassigned: number;
  /** Total number of open tickets assigned to the calling agent. */
  mine_open: number;
  /** Ticket count grouped by system state. */
  by_state: {
    [key: string]: number;
  };
  /** Open ticket count grouped by ticket type. */
  by_type: {
    [key: string]: number;
  };
  /** Breakdown of open tickets by priority. */
  by_priority: QueueStatsPriorityItemRead[];
  /** Breakdown of open tickets by team. */
  by_team: QueueStatsTeamItemRead[];
  /** Breakdown of open tickets by assignee (top 20). */
  by_assignee: QueueStatsAssigneeItemRead[];
  /** Current SLA breach and pause counters. */
  sla: QueueStatsSla;
  /** Total tickets created within the window. */
  created: number;
  /** Total tickets resolved within the window. */
  resolved: number;
  /** Total tickets reopened within the window. */
  reopened: number;
  /** Average first response time in minutes. */
  avg_first_response_minutes: number | null;
  /** Average resolution time in minutes. */
  avg_resolution_minutes: number | null;
  /** Average CSAT rating within the window (1.0 to 5.0). */
  csat_average: number | null;
  /** Number of CSAT ratings submitted within the window. */
  csat_responses: number;
};
export type SupportQueueStatsSerializersQueueStatsDetailResponse = {
  data: QueueStats;
};
export type SupportQueueStatsSerializersQueueStatsDetailResponseRead = {
  data: QueueStatsRead;
};
export type UserGroupListApiUserGroupPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type UserGroupListApiUserGroupPaginationMeta = {
  pagination: UserGroupListApiUserGroupPagination;
};
export type UserGroup = {};
export type UserGroupRead = {
  id: number;
  name: string;
  user_count: number;
  users_url: string;
};
export type UserGroupListApiUserGroupPaginatedResponse = {
  meta: UserGroupListApiUserGroupPaginationMeta;
  data: UserGroup[];
};
export type UserGroupListApiUserGroupPaginatedResponseRead = {
  meta: UserGroupListApiUserGroupPaginationMeta;
  data: UserGroupRead[];
};
export type UserGroupMemberListApiUserGroupMemberPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type UserGroupMemberListApiUserGroupMemberPaginationMeta = {
  pagination: UserGroupMemberListApiUserGroupMemberPagination;
};
export type UserGroupMember = {};
export type UserGroupMemberRead = {
  id: number;
  name: string;
};
export type UserGroupMemberListApiUserGroupMemberPaginatedResponse = {
  meta: UserGroupMemberListApiUserGroupMemberPaginationMeta;
  data: UserGroupMember[];
};
export type UserGroupMemberListApiUserGroupMemberPaginatedResponseRead = {
  meta: UserGroupMemberListApiUserGroupMemberPaginationMeta;
  data: UserGroupMemberRead[];
};
export type UsersSerializersUserPagination = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
};
export type UsersSerializersUserPaginationMeta = {
  pagination: UsersSerializersUserPagination;
};
export type User = {
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: string;
  display_name?: string;
};
export type UserRead = {
  id: number;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: string;
  display_name?: string;
  avatar_url: string | null;
};
export type UsersSerializersUserPaginatedResponse = {
  meta: UsersSerializersUserPaginationMeta;
  data: User[];
};
export type UsersSerializersUserPaginatedResponseRead = {
  meta: UsersSerializersUserPaginationMeta;
  data: UserRead[];
};
export type UserSerializersUserDetailResponse = {
  data: User;
};
export type UserSerializersUserDetailResponseRead = {
  data: UserRead;
};
export type PatchedUpdateUser = {
  display_name?: string;
  name?: string;
  department?: string;
};
export type UserAvatarRead = {};
export type UserAvatarReadRead = {
  avatar_url: string | null;
};
export type UserAvatarSerializersUserAvatarReadDetailResponse = {
  data: UserAvatarRead;
};
export type UserAvatarSerializersUserAvatarReadDetailResponseRead = {
  data: UserAvatarReadRead;
};
export type UserAvatarUpload = {
  avatar: string;
};
export type UserWithPermission = {
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: string;
  display_name?: string;
};
export type GroupPermission = {
  name: string;
};
export type GroupPermissionRead = {
  id: number;
  name: string;
};
export type EffectiveRoles = {};
export type EffectiveRolesRead = {
  labs: string[];
};
export type UserWithPermissionRead = {
  id: number;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: string;
  display_name?: string;
  avatar_url: string | null;
  groups: GroupPermissionRead[];
  effective_roles: EffectiveRolesRead;
};
export type CurrentUserSerializersUserWithPermissionDetailResponse = {
  data: UserWithPermission;
};
export type CurrentUserSerializersUserWithPermissionDetailResponseRead = {
  data: UserWithPermissionRead;
};
export type ModeEnum = "delta" | "reset";
export type OpEnum = "upsert" | "delete";
export type ChangeItem = {
  version: number;
  op: OpEnum;
  key: string;
  state?: string;
  data?: {
    [key: string]: any;
  };
};
export type ChangesResponseData = {
  backend_id: string;
  entity_type: string;
  epoch: string;
  mode: ModeEnum;
  version?: number;
  head_version: number;
  has_more?: boolean;
  oldest_retained_version?: number;
  changes?: ChangeItem[];
  reason?: string;
};
export type ChangesResponse = {
  data: ChangesResponseData;
};
export type DigestResponseData = {
  entity_type: string;
  epoch: string;
  version: number;
  count: number;
  checksum: string;
};
export type DigestResponse = {
  data: DigestResponseData;
};
export type SyncStreamEntityInfo = {
  version: number;
  epoch: string;
};
export type SyncStreamLimits = {
  snapshot_max_limit: number;
  changes_max_limit: number;
  longpoll_max_wait_s: number;
};
export type SyncInfoResponseData = {
  backend_id: string;
  server_time: string;
  entities: {
    [key: string]: SyncStreamEntityInfo;
  };
  limits: SyncStreamLimits;
};
export type SyncInfoResponse = {
  data: SyncInfoResponseData;
};
export type SnapshotItem = {
  key: string;
  version: number;
  state: string;
  data: {
    [key: string]: any;
  };
};
export type SnapshotResponseData = {
  backend_id: string;
  entity_type: string;
  epoch: string;
  head_version: number;
  items: SnapshotItem[];
  next_after: string | null;
};
export type SnapshotResponse = {
  data: SnapshotResponseData;
};
export const {
  useAgentCheckInBookingMutation,
  useAgentCompleteBookingMutation,
  useAgentExtendBookingMutation,
  useAgentValidateBookingMutation,
  useAgentDeviceObservationsActionsReportCreateMutation,
  useEnrollAgentMutation,
  useAgentReportActivityMutation,
  useAgentHeartbeatMutation,
  useGetAgentInfoQuery,
  useAgentMonitoringPolicyRetrieveQuery,
  useAgentRecordSessionLogMutation,
  useAadLoginCreateMutation,
  useListAgentsQuery,
  useCreateAgentGrantMutation,
  useGetAgentDetailQuery,
  useDecommissionAgentMutation,
  useRevokeAgentMutation,
  useListAgentGrantsQuery,
  useCreateAgentRecoveryGrantMutation,
  useRevokeAgentGrantMutation,
  useCsrfTokenRetrieveQuery,
  useLabsAnalyticsBenchGroupRetrieveQuery,
  useLabsAnalyticsBookedVsUsedRetrieveQuery,
  useLabsAnalyticsBookingRetrieveQuery,
  useLabsAnalyticsEquipmentAvailabilityRetrieveQuery,
  useLabsAnalyticsFinanceExpenseTypeBreakdownRetrieveQuery,
  useLabsAnalyticsFinanceMonthlyTrendsRetrieveQuery,
  useLabsAnalyticsFinanceSummaryRetrieveQuery,
  useLabsAnalyticsLabCountRetrieveQuery,
  useLabsAnalyticsLabEfficiencyRetrieveQuery,
  useLabsAnalyticsLabEquipmentStatusRetrieveQuery,
  useLabsAnalyticsLabUsageByTimeframeRetrieveQuery,
  useLabsAnalyticsLabVisitsRetrieveQuery,
  useLabsAnalyticsLabVisitsCreateMutation,
  useLabsAnalyticsProjectUsageRetrieveQuery,
  useLabsAnalyticsStorageQuotaRetrieveQuery,
  useLabsAnalyticsStorageQuotaCreateMutation,
  useLabsAnalyticsUserBookingEfficiencyRetrieveQuery,
  useLabsAnalyticsUserCountRetrieveQuery,
  useLabsAnalyticsUserLabUsageRetrieveQuery,
  useLabsAuditCatalogRetrieveQuery,
  useLabsAuditsRetrieveQuery,
  useLabsAuditsRetrieveByAuditIdQuery,
  useLabsAuditsPartialUpdateByAuditIdMutation,
  useLabsAuditsDestroyByAuditIdMutation,
  useLabsBenchBookingsRetrieveQuery,
  useLabsBenchBookingsCreateMutation,
  useLabsBenchBookingsRetrieveByBookingIdQuery,
  useLabsBenchBookingsPartialUpdateByBookingIdMutation,
  useLabsBenchBookingsActionsApproveCreateByBookingIdMutation,
  useLabsBenchBookingsActionsCancelCreateByBookingIdMutation,
  useLabsBenchBookingsActionsCompleteCreateByBookingIdMutation,
  useLabsBenchBookingsActionsRejectCreateByBookingIdMutation,
  useLabsBenchBookingsCodeRetrieveByBookingCodeQuery,
  useLabsBenchBookingsCodePartialUpdateByBookingCodeMutation,
  useLabsBenchBookingsCodeActionsCancelCreateByBookingCodeMutation,
  useLabsBenchBookingsReferenceDataProjectsRetrieveQuery,
  useLabsBenchBookingsReferenceDataProjectsCreateMutation,
  useLabsBenchBookingsReferenceDataProjectsRetrieveByReferenceIdQuery,
  useLabsBenchGroupsRetrieveQuery,
  useLabsBenchGroupsCreateMutation,
  useLabsBenchGroupsRetrieveByReferenceIdQuery,
  useLabsBenchGroupsPartialUpdateByReferenceIdMutation,
  useLabsBenchGroupsDestroyByReferenceIdMutation,
  useLabsBenchGroupsOptionsRetrieveQuery,
  useLabsBenchTypesRetrieveQuery,
  useLabsBenchTypesCreateMutation,
  useLabsBenchTypesRetrieveByReferenceIdQuery,
  useLabsBenchTypesPartialUpdateByReferenceIdMutation,
  useLabsBenchTypesDestroyByReferenceIdMutation,
  useLabsBenchTypesOptionsRetrieveQuery,
  useLabsBenchesRetrieveQuery,
  useLabsBenchesCreateMutation,
  useLabsBenchesRetrieveByBenchIdQuery,
  useLabsBenchesUpdateByBenchIdMutation,
  useLabsBenchesPartialUpdateByBenchIdMutation,
  useLabsBenchesDestroyByBenchIdMutation,
  useLabsBenchesActionsChangeLifecycleCreateByBenchIdMutation,
  useLabsBenchesActionsFavoriteCreateByBenchIdMutation,
  useLabsBenchesActionsFavoriteDestroyByBenchIdMutation,
  useLabsBenchesActionsPlaceCreateByBenchIdMutation,
  useLabsBenchesActionsPlacePartialUpdateByBenchIdMutation,
  useLabsBenchesEquipmentRetrieveByBenchIdQuery,
  useLabsBenchesImageRetrieveByBenchIdQuery,
  useLabsBenchesImageUpdateByBenchIdMutation,
  useLabsBenchesImageDestroyByBenchIdMutation,
  useLabsBenchesProfileRetrieveByIdQuery,
  useLabsBenchesWeeklyUsageRetrieveByIdQuery,
  useLabsBenchesMappingRetrieveByResourceIdQuery,
  useLabsBenchesBookingChoicesRetrieveQuery,
  useLabsBenchesFiltersRetrieveQuery,
  useLabsBenchesOptionsRetrieveQuery,
  useLabsBenchesReferenceDataRetrieveQuery,
  useLabsBenchesReferenceDataGroupsRetrieveQuery,
  useLabsBenchesReferenceDataGroupsCreateMutation,
  useLabsBenchesReferenceDataGroupsRetrieveByReferenceIdQuery,
  useLabsBenchesReferenceDataTypesRetrieveQuery,
  useLabsBenchesReferenceDataTypesCreateMutation,
  useLabsBenchesReferenceDataTypesRetrieveByReferenceIdQuery,
  useLabsBenchesStatusSummaryRetrieveQuery,
  useLabsBuildingsRetrieveQuery,
  useLabsBuildingsRetrieveByBuildingIdQuery,
  useLabsBuildingsOptionsRetrieveQuery,
  useLabsCitiesRetrieveQuery,
  useLabsCitiesRetrieveByCityIdQuery,
  useLabsCitiesOptionsRetrieveQuery,
  useLabsCountriesRetrieveQuery,
  useLabsCountriesRetrieveByCountryIdQuery,
  useLabsCountriesOptionsRetrieveQuery,
  useLabsDashboardRetrieveQuery,
  useLabsDashboardBenchesRetrieveByBenchIdQuery,
  useLabsDashboardSummaryRetrieveQuery,
  useLabsDepartmentsRetrieveQuery,
  useLabsDepartmentsRetrieveByDepartmentIdQuery,
  useLabsDepartmentsOptionsRetrieveQuery,
  useLabsDeviceConnectionsRetrieveQuery,
  useLabsDeviceConnectionsRetrieveByConnectionIdQuery,
  useLabsDeviceConnectionsActionsLinkCreateByConnectionIdMutation,
  useLabsDeviceConnectionsSummaryRetrieveQuery,
  useLabsDowntimesRetrieveQuery,
  useLabsDowntimesCreateMutation,
  useLabsDowntimesRetrieveByDowntimeIdQuery,
  useLabsDowntimesActionsCancelCreateByDowntimeIdMutation,
  useLabsDowntimesActionsEndCreateByDowntimeIdMutation,
  useLabsEquipmentRetrieveQuery,
  useLabsEquipmentCreateMutation,
  useLabsEquipmentCategoriesRetrieveQuery,
  useLabsEquipmentCategoriesRetrieveByCategoryIdQuery,
  useLabsEquipmentCategoriesOptionsRetrieveQuery,
  useLabsEquipmentKindsRetrieveQuery,
  useLabsEquipmentKindsRetrieveByKindIdQuery,
  useLabsEquipmentKindsOptionsRetrieveQuery,
  useLabsEquipmentLoanBatchesRetrieveByBatchIdQuery,
  useLabsEquipmentLoansRetrieveQuery,
  useLabsEquipmentLoansCreateMutation,
  useLabsEquipmentLoansActionsExtendCreateMutation,
  useLabsEquipmentLoansActionsReturnCreateMutation,
  useLabsEquipmentManufacturersRetrieveQuery,
  useLabsEquipmentManufacturersRetrieveByManufacturerIdQuery,
  useLabsEquipmentManufacturersOptionsRetrieveQuery,
  useLabsEquipmentProductModelsRetrieveQuery,
  useLabsEquipmentProductModelsRetrieveByModelIdQuery,
  useLabsEquipmentProductModelsOptionsRetrieveQuery,
  useLabsEquipmentReservationsRetrieveQuery,
  useLabsEquipmentReservationsCreateMutation,
  useLabsEquipmentReservationsRetrieveByBatchIdQuery,
  useLabsEquipmentReservationsPartialUpdateByBatchIdMutation,
  useLabsEquipmentReservationsActionsCancelCreateByBatchIdMutation,
  useLabsEquipmentReservationsActionsHandOverCreateByBatchIdMutation,
  useLabsEquipmentTypesRetrieveQuery,
  useLabsEquipmentTypesRetrieveByTypeIdQuery,
  useLabsEquipmentTypesOptionsRetrieveQuery,
  useLabsEquipmentActionsChangeConditionCreateByEquipmentIdMutation,
  useLabsEquipmentActionsChangeLifecycleCreateByEquipmentIdMutation,
  useLabsEquipmentActionsExtendLoanCreateByEquipmentIdMutation,
  useLabsEquipmentActionsHandOverCreateByEquipmentIdMutation,
  useLabsEquipmentActionsReturnCreateByEquipmentIdMutation,
  useLabsEquipmentActivityRetrieveByEquipmentIdQuery,
  useLabsEquipmentAssignmentRetrieveByEquipmentIdQuery,
  useLabsEquipmentAssignmentUpdateByEquipmentIdMutation,
  useLabsEquipmentAssignmentDestroyByEquipmentIdMutation,
  useLabsEquipmentHardwareIdsRetrieveByEquipmentIdQuery,
  useLabsEquipmentHardwareIdsCreateByEquipmentIdMutation,
  useLabsEquipmentHardwareIdsDestroyByEquipmentIdHardwareIdIdMutation,
  useLabsEquipmentImageRetrieveByEquipmentIdQuery,
  useLabsEquipmentImageUpdateByEquipmentIdMutation,
  useLabsEquipmentImageDestroyByEquipmentIdMutation,
  useLabsEquipmentLoanRetrieveByEquipmentIdQuery,
  useLabsEquipmentPlacementRetrieveByEquipmentIdQuery,
  useLabsEquipmentPlacementUpdateByEquipmentIdMutation,
  useLabsEquipmentPlacementDestroyByEquipmentIdMutation,
  useLabsEquipmentStatusChangesRetrieveByEquipmentIdQuery,
  useLabsEquipmentRetrieveByIdQuery,
  useLabsEquipmentUpdateByIdMutation,
  useLabsEquipmentPartialUpdateByIdMutation,
  useLabsEquipmentDestroyByIdMutation,
  useLabsEquipmentMappingRetrieveByResourceIdQuery,
  useLabsEquipmentComputingActivitySummaryRetrieveQuery,
  useLabsEquipmentFacetsRetrieveQuery,
  useLabsEquipmentFiltersRetrieveQuery,
  useLabsEquipmentOptionsRetrieveQuery,
  useLabsEquipmentReferenceDataRetrieveQuery,
  useLabsEquipmentReferenceDataCategoriesRetrieveQuery,
  useLabsEquipmentReferenceDataCategoriesRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataDepartmentsRetrieveQuery,
  useLabsEquipmentReferenceDataDepartmentsCreateMutation,
  useLabsEquipmentReferenceDataDepartmentsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataDisplayResolutionsRetrieveQuery,
  useLabsEquipmentReferenceDataDisplayResolutionsCreateMutation,
  useLabsEquipmentReferenceDataDisplayResolutionsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataDisplaySizesRetrieveQuery,
  useLabsEquipmentReferenceDataDisplaySizesCreateMutation,
  useLabsEquipmentReferenceDataDisplaySizesRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataGroupsRetrieveQuery,
  useLabsEquipmentReferenceDataGroupsCreateMutation,
  useLabsEquipmentReferenceDataGroupsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataInterfacesRetrieveQuery,
  useLabsEquipmentReferenceDataInterfacesCreateMutation,
  useLabsEquipmentReferenceDataInterfacesRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataKindsRetrieveQuery,
  useLabsEquipmentReferenceDataKindsCreateMutation,
  useLabsEquipmentReferenceDataKindsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataManufacturersRetrieveQuery,
  useLabsEquipmentReferenceDataManufacturersCreateMutation,
  useLabsEquipmentReferenceDataManufacturersRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataMaterialsRetrieveQuery,
  useLabsEquipmentReferenceDataMaterialsCreateMutation,
  useLabsEquipmentReferenceDataMaterialsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataNetworkingProtocolsRetrieveQuery,
  useLabsEquipmentReferenceDataNetworkingProtocolsCreateMutation,
  useLabsEquipmentReferenceDataNetworkingProtocolsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataProductModelSpecificationsRetrieveQuery,
  useLabsEquipmentReferenceDataProductModelSpecificationsCreateMutation,
  useLabsEquipmentReferenceDataProductModelSpecificationsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataProductModelsRetrieveQuery,
  useLabsEquipmentReferenceDataProductModelsCreateMutation,
  useLabsEquipmentReferenceDataProductModelsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataSampleCharacteristicsRetrieveQuery,
  useLabsEquipmentReferenceDataSampleCharacteristicsCreateMutation,
  useLabsEquipmentReferenceDataSampleCharacteristicsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataSampleCustomersRetrieveQuery,
  useLabsEquipmentReferenceDataSampleCustomersCreateMutation,
  useLabsEquipmentReferenceDataSampleCustomersRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataSpecificationDefinitionsRetrieveQuery,
  useLabsEquipmentReferenceDataSpecificationDefinitionsCreateMutation,
  useLabsEquipmentReferenceDataSpecificationDefinitionsRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataTechnicalUsersRetrieveQuery,
  useLabsEquipmentReferenceDataTechnicalUsersCreateMutation,
  useLabsEquipmentReferenceDataTechnicalUsersRetrieveByReferenceIdQuery,
  useLabsEquipmentReferenceDataTypesRetrieveQuery,
  useLabsEquipmentReferenceDataTypesCreateMutation,
  useLabsEquipmentReferenceDataTypesRetrieveByReferenceIdQuery,
  useLabsEquipmentSkuRetrieveBySkuQuery,
  useLabsEquipmentSkuPartialUpdateBySkuMutation,
  useLabsEquipmentStatusSummaryRetrieveQuery,
  useLabsEquipmentUidRetrieveByUidQuery,
  useLabsEquipmentUidPartialUpdateByUidMutation,
  useLabsExpectedDevicesRetrieveQuery,
  useLabsExpectedDevicesCreateMutation,
  useLabsExpectedDevicesPartialUpdateByExpectedDeviceIdMutation,
  useLabsExpectedDevicesDestroyByExpectedDeviceIdMutation,
  useLabsExpectedDevicesLegacySuggestionsRetrieveQuery,
  useLabsExpensesPaymentsRetrieveByExpenseIdQuery,
  useLabsExpensesPaymentsCreateByExpenseIdMutation,
  useLabsExpensesReportRetrieveQuery,
  useLabsGroupsRetrieveQuery,
  useLabsGroupsRetrieveByGroupIdQuery,
  useLabsGroupsOptionsRetrieveQuery,
  useLabsLabDashboardRetrieveQuery,
  useLabsLabProjectsRetrieveQuery,
  useLabsLabProjectsRetrieveByProjectIdQuery,
  useLabsLabProjectsOptionsRetrieveQuery,
  useLabsLabSessionsRetrieveQuery,
  useLabsLeaderboardExportRetrieveQuery,
  useLabsLeaderboardLabRetrieveQuery,
  useLabsLeaderboardPersonaRetrieveQuery,
  useLabsLeaderboardUsersProfileRetrieveByIdQuery,
  useLabsLeaderboardUsersWeeklyUsageRetrieveByIdQuery,
  useLabsLicenseCategoriesRetrieveQuery,
  useLabsLicenseCategoriesRetrieveByCategoryIdQuery,
  useLabsLicenseCategoriesOptionsRetrieveQuery,
  useLabsLicenseProductsRetrieveQuery,
  useLabsLicenseProductsRetrieveByProductIdQuery,
  useLabsLicenseProductsOptionsRetrieveQuery,
  useLabsLicenseRestrictionsRetrieveQuery,
  useLabsLicenseRestrictionsRetrieveByRestrictionIdQuery,
  useLabsLicenseRestrictionsOptionsRetrieveQuery,
  useLabsLicenseTypesRetrieveQuery,
  useLabsLicenseTypesRetrieveByTypeIdQuery,
  useLabsLicenseTypesOptionsRetrieveQuery,
  useLabsLicenseVendorsRetrieveQuery,
  useLabsLicenseVendorsRetrieveByVendorIdQuery,
  useLabsLicenseVendorsOptionsRetrieveQuery,
  useLabsLicensesRetrieveQuery,
  useLabsLicensesCreateMutation,
  useLabsLicensesRetrieveByLicenseIdQuery,
  useLabsLicensesPartialUpdateByLicenseIdMutation,
  useLabsLicensesDestroyByLicenseIdMutation,
  useLabsLicensesActionsAssignCreateByLicenseIdMutation,
  useLabsLicensesActionsAssignDestroyByLicenseIdMutation,
  useLabsLicensesActionsChangeStatusCreateByLicenseIdMutation,
  useLabsLicensesAgreementsRetrieveByLicenseIdQuery,
  useLabsLicensesAgreementsCreateByLicenseIdMutation,
  useLabsLicensesHistoryRetrieveByLicenseIdQuery,
  useLabsLicensesImageRetrieveByLicenseIdQuery,
  useLabsLicensesImageUpdateByLicenseIdMutation,
  useLabsLicensesImageDestroyByLicenseIdMutation,
  useLabsLicensesCategoriesSummaryRetrieveQuery,
  useLabsLicensesFiltersRetrieveQuery,
  useLabsLicensesReferenceDataCategoriesRetrieveQuery,
  useLabsLicensesReferenceDataCategoriesCreateMutation,
  useLabsLicensesReferenceDataCategoriesRetrieveByReferenceIdQuery,
  useLabsLicensesReferenceDataProductsRetrieveQuery,
  useLabsLicensesReferenceDataProductsCreateMutation,
  useLabsLicensesReferenceDataProductsRetrieveByReferenceIdQuery,
  useLabsLicensesReferenceDataRestrictionsRetrieveQuery,
  useLabsLicensesReferenceDataRestrictionsCreateMutation,
  useLabsLicensesReferenceDataRestrictionsRetrieveByReferenceIdQuery,
  useLabsLicensesReferenceDataTypesRetrieveQuery,
  useLabsLicensesReferenceDataTypesCreateMutation,
  useLabsLicensesReferenceDataTypesRetrieveByReferenceIdQuery,
  useLabsLicensesReferenceDataVendorsRetrieveQuery,
  useLabsLicensesReferenceDataVendorsCreateMutation,
  useLabsLicensesReferenceDataVendorsRetrieveByReferenceIdQuery,
  useLabsLicensesStatusSummaryRetrieveQuery,
  useLabsLocationsReferenceDataBuildingsRetrieveQuery,
  useLabsLocationsReferenceDataBuildingsCreateMutation,
  useLabsLocationsReferenceDataBuildingsRetrieveByReferenceIdQuery,
  useLabsLocationsReferenceDataCitiesRetrieveQuery,
  useLabsLocationsReferenceDataCitiesCreateMutation,
  useLabsLocationsReferenceDataCitiesRetrieveByReferenceIdQuery,
  useLabsLocationsReferenceDataCountriesRetrieveQuery,
  useLabsLocationsReferenceDataCountriesCreateMutation,
  useLabsLocationsReferenceDataCountriesRetrieveByReferenceIdQuery,
  useLabsLocationsReferenceDataStationTypesRetrieveQuery,
  useLabsLocationsReferenceDataStationTypesCreateMutation,
  useLabsLocationsReferenceDataStationTypesRetrieveByReferenceIdQuery,
  useLabsMonitoringEventsRetrieveQuery,
  useLabsMonitoringEventsCreateMutation,
  useLabsMonitoringEventsRetrieveByIdQuery,
  useLabsMonitoringEventsExportRetrieveQuery,
  useLabsPurchaseItemsResourcesRetrieveByPurchaseItemIdQuery,
  useLabsPurchaseItemsResourcesCreateByPurchaseItemIdMutation,
  useLabsPurchasePrioritiesRetrieveQuery,
  useLabsPurchasesRetrieveQuery,
  useLabsPurchasesCreateMutation,
  useLabsPurchasesRetrieveByPurchaseIdQuery,
  useLabsPurchasesDraftPartialUpdateByPurchaseIdMutation,
  useLabsPurchasesItemsRetrieveByPurchaseIdQuery,
  useLabsPurchasesItemsCreateByPurchaseIdMutation,
  useLabsPurchasesItemsRetrieveByPurchaseIdItemIdQuery,
  useLabsPurchasesItemsPartialUpdateByPurchaseIdItemIdMutation,
  useLabsPurchasesItemsDestroyByPurchaseIdItemIdMutation,
  useLabsPurchasesItemsDraftRetrieveByPurchaseIdQuery,
  useLabsPurchasesItemsDraftCreateByPurchaseIdMutation,
  useLabsPurchasesTransactionsRetrieveByPurchaseIdQuery,
  useLabsPurchasesTransactionsCreateByPurchaseIdMutation,
  useLabsResourceMappingsRetrieveQuery,
  useLabsResourcesAuditsRetrieveByResourceTypeResourceIdQuery,
  useLabsResourcesAuditsCreateByResourceTypeResourceIdMutation,
  useLabsResourcesIdAuditsRetrieveByResourceIdQuery,
  useLabsResourcesIdAuditsCreateByResourceIdMutation,
  useLabsResourcesSkuAuditsRetrieveBySkuQuery,
  useLabsResourcesSkuAuditsCreateBySkuMutation,
  useLabsResourcesUidAuditsRetrieveByUidQuery,
  useLabsResourcesUidAuditsCreateByUidMutation,
  useLabsRoomsRetrieveQuery,
  useLabsRoomsCreateMutation,
  useLabsRoomsMappingRetrieveByResourceIdQuery,
  useLabsRoomsRetrieveByRoomIdQuery,
  useLabsRoomsUpdateByRoomIdMutation,
  useLabsRoomsPartialUpdateByRoomIdMutation,
  useLabsRoomsDestroyByRoomIdMutation,
  useLabsRoomsActionsChangeLifecycleCreateByRoomIdMutation,
  useLabsRoomsActionsChangeStatusCreateByRoomIdMutation,
  useLabsRoomsActionsGenerateSlotsCreateByRoomIdMutation,
  useLabsRoomsExpensesRetrieveByRoomIdQuery,
  useLabsRoomsExpensesCreateByRoomIdMutation,
  useLabsRoomsExpensesReportRetrieveByRoomIdQuery,
  useLabsRoomsHistoryRetrieveByRoomIdQuery,
  useLabsRoomsImageRetrieveByRoomIdQuery,
  useLabsRoomsImageUpdateByRoomIdMutation,
  useLabsRoomsImageDestroyByRoomIdMutation,
  useLabsRoomsObservationsRetrieveByRoomIdQuery,
  useLabsRoomsObservationsCreateByRoomIdMutation,
  useLabsRoomsSlotsRetrieveByRoomIdQuery,
  useLabsRoomsFiltersRetrieveQuery,
  useLabsRoomsOptionsRetrieveQuery,
  useLabsRoomsStatusSummaryRetrieveQuery,
  useLabsStationTypesRetrieveQuery,
  useLabsStationTypesCreateMutation,
  useLabsStationTypesRetrieveByTypeIdQuery,
  useLabsStationTypesPartialUpdateByTypeIdMutation,
  useLabsStationTypesDestroyByTypeIdMutation,
  useLabsStationTypesOptionsRetrieveQuery,
  useLabsStationsRetrieveQuery,
  useLabsStationsCreateMutation,
  useLabsStationsMappingRetrieveByResourceIdQuery,
  useLabsStationsRetrieveByStationIdQuery,
  useLabsStationsUpdateByStationIdMutation,
  useLabsStationsPartialUpdateByStationIdMutation,
  useLabsStationsDestroyByStationIdMutation,
  useLabsStationsActionsChangeLifecycleCreateByStationIdMutation,
  useLabsStationsActionsChangeStatusCreateByStationIdMutation,
  useLabsStationsActionsPlaceCreateByStationIdMutation,
  useLabsStationsActionsPlacePartialUpdateByStationIdMutation,
  useLabsStationsHistoryRetrieveByStationIdQuery,
  useLabsStationsImageRetrieveByStationIdQuery,
  useLabsStationsImageUpdateByStationIdMutation,
  useLabsStationsImageDestroyByStationIdMutation,
  useLabsStationsSlotsRetrieveByStationIdQuery,
  useLabsStationsSlotsCreateByStationIdMutation,
  useLabsStationsSlotsRetrieveByStationIdSlotIdQuery,
  useLabsStationsSlotsUpdateByStationIdSlotIdMutation,
  useLabsStationsSlotsPartialUpdateByStationIdSlotIdMutation,
  useLabsStationsSlotsDestroyByStationIdSlotIdMutation,
  useLabsStationsFiltersRetrieveQuery,
  useLabsStationsOptionsRetrieveQuery,
  useLabsStationsReferenceDataRetrieveQuery,
  useLabsStationsStatusSummaryRetrieveQuery,
  useLabsWorkbookImportsActionsApplyCreateMutation,
  useLabsWorkbookImportsActionsCheckCreateMutation,
  useLabsWorkbookImportsExportRetrieveQuery,
  useLabsWorkbookImportsTemplateRetrieveQuery,
  useLoginCreateMutation,
  useLogoutCreateMutation,
  useNotificationsListQuery,
  useNotificationsCreateMutation,
  useRefreshTokenCreateMutation,
  useSchemaRetrieveQuery,
  useSendOtpCreateMutation,
  useSupportAdminCannedResponsesRetrieveQuery,
  useSupportAdminCannedResponsesCreateMutation,
  useSupportAdminCannedResponsesPartialUpdateByResponseIdMutation,
  useSupportAdminCannedResponsesDestroyByResponseIdMutation,
  useSupportAdminSettingsRetrieveQuery,
  useSupportAdminSettingsPartialUpdateMutation,
  useSupportAdminTransitionsRetrieveQuery,
  useSupportAdminTransitionsCreateMutation,
  useSupportAdminTransitionsPartialUpdateByTransitionIdMutation,
  useSupportAdminTransitionsDestroyByTransitionIdMutation,
  useSupportAttachmentsDownloadRetrieveByAttachmentIdQuery,
  useSupportCannedResponsesRetrieveQuery,
  useSupportCategoriesRetrieveQuery,
  useSupportCategoriesCreateMutation,
  useSupportCategoriesPartialUpdateByCategoryIdMutation,
  useSupportCategoriesDestroyByCategoryIdMutation,
  useSupportCategoriesOptionsRetrieveQuery,
  useSupportLabelsRetrieveQuery,
  useSupportLabelsCreateMutation,
  useSupportLabelsPartialUpdateByLabelIdMutation,
  useSupportLabelsDestroyByLabelIdMutation,
  useSupportLabelsOptionsRetrieveQuery,
  useSupportPrioritiesRetrieveQuery,
  useSupportPrioritiesCreateMutation,
  useSupportPrioritiesPartialUpdateByPriorityIdMutation,
  useSupportPrioritiesDestroyByPriorityIdMutation,
  useSupportPrioritiesOptionsRetrieveQuery,
  useSupportResourcesTicketsRetrieveByResourceTypeResourceIdQuery,
  useSupportStatusesRetrieveQuery,
  useSupportStatusesCreateMutation,
  useSupportStatusesPartialUpdateByStatusIdMutation,
  useSupportStatusesOptionsRetrieveQuery,
  useSupportTeamsRetrieveQuery,
  useSupportTeamsCreateMutation,
  useSupportTeamsPartialUpdateByTeamIdMutation,
  useSupportTeamsDestroyByTeamIdMutation,
  useSupportTeamsOptionsRetrieveQuery,
  useSupportTicketsRetrieveQuery,
  useSupportTicketsCreateMutation,
  useSupportTicketsRetrieveByKeyQuery,
  useSupportTicketsPartialUpdateByKeyMutation,
  useSupportTicketsActionsAssignCreateByKeyMutation,
  useSupportTicketsActionsSubmitCsatCreateByKeyMutation,
  useSupportTicketsActionsTransitionCreateByKeyMutation,
  useSupportTicketsActivityRetrieveByKeyQuery,
  useSupportTicketsAttachmentsCreateByKeyMutation,
  useSupportTicketsAttachmentsDestroyByKeyAttachmentIdMutation,
  useSupportTicketsCommentsRetrieveByKeyQuery,
  useSupportTicketsCommentsCreateByKeyMutation,
  useSupportTicketsCommentsPartialUpdateByKeyCommentIdMutation,
  useSupportTicketsCommentsDestroyByKeyCommentIdMutation,
  useSupportTicketsLinksRetrieveByKeyQuery,
  useSupportTicketsLinksCreateByKeyMutation,
  useSupportTicketsLinksDestroyByKeyLinkIdMutation,
  useSupportTicketsResourcesCreateByKeyMutation,
  useSupportTicketsResourcesDestroyByKeyMutation,
  useSupportTicketsWatchersCreateByKeyMutation,
  useSupportTicketsWatchersDestroyByKeyMutation,
  useSupportTicketsStatsRetrieveQuery,
  useUserGroupsRetrieveQuery,
  useUserGroupsUsersRetrieveByGroupIdQuery,
  useUsersRetrieveQuery,
  useUsersRetrieveByIdQuery,
  useUsersPartialUpdateByIdMutation,
  useUsersAvatarRetrieveQuery,
  useUsersAvatarCreateMutation,
  useUsersAvatarDestroyMutation,
  useUsersMeRetrieveQuery,
  useGetInternalChangesQuery,
  useGetInternalDigestQuery,
  useGetInternalInfoQuery,
  useGetInternalSnapshotQuery,
} = injectedRtkApi;
