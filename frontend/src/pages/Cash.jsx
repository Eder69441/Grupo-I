import { useEffect, useState } from "react";

import { Landmark } from "lucide-react";

import CashStatus from "../components/cash/CashStatus";
import OpenCashForm from "../components/cash/OpenCashForm";
import CloseCashForm from "../components/cash/CloseCashForm";
import CashHistoryTable from "../components/cash/CashHistoryTable";
import CashSummary from "../components/cash/CashSummary";
import CashClosingSummary from "../components/cash/CashClosingSummary";
import CashSessionDetail from "../components/cash/CashSessionDetail";

import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";

import {
  closeCashSession,
  getCashSessionById,
  getCashSessions,
  getCurrentCashSession,
  openCashSession,
} from "../services/cashSessionService";

export default function Cash() {
  const [currentSession, setCurrentSession] = useState(null);

  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [lastClosedSession, setLastClosedSession] = useState(null);

  const [selectedSession, setSelectedSession] = useState(null);

  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const loadCashData = async () => {
      try {
        const [currentResponse, historyResponse] = await Promise.all([
          getCurrentCashSession(),
          getCashSessions(),
        ]);

        setCurrentSession(currentResponse.data);

        setSessions(historyResponse.data);
      } catch (error) {
        console.error(error);

        setError("No se pudo cargar la información de caja.");
      } finally {
        setLoading(false);
      }
    };

    loadCashData();
  }, []);

  const reloadCashData = async () => {
    const [currentResponse, historyResponse] = await Promise.all([
      getCurrentCashSession(),
      getCashSessions(),
    ]);

    setCurrentSession(currentResponse.data);

    setSessions(historyResponse.data);
  };

  const handleOpen = async (openingAmount) => {
    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      await openCashSession({
        openingAmount,
      });

      setLastClosedSession(null);

      await reloadCashData();

      setSuccess("Caja abierta correctamente.");

      return true;
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "No se pudo abrir la caja.");

      return false;
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async (countedCash) => {
    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const response = await closeCashSession({
        countedCash,
      });

      setLastClosedSession(response.data);

      await reloadCashData();

      setSuccess("Caja cerrada correctamente.");

      return true;
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "No se pudo cerrar la caja.");

      return false;
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const handleViewSession = async (session) => {
    try {
      setLoadingDetail(true);
      setError("");

      const response = await getCashSessionById(session._id);

      setSelectedSession(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No se pudo consultar el detalle de la caja.",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Landmark size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Caja
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Apertura, cierre y control de sesiones de caja.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorMessage message={error} />
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {lastClosedSession && (
        <div className="mb-8">
          <CashClosingSummary
            session={lastClosedSession}
            onClose={() => setLastClosedSession(null)}
          />
        </div>
      )}

      {currentSession ? (
        <div className="space-y-5">
          <CashStatus cashSession={currentSession} />

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <CashSummary summary={currentSession.summary} />
            </div>

            <CloseCashForm onClose={handleClose} loading={processing} />
          </div>
        </div>
      ) : (
        <div className="max-w-xl">
          <OpenCashForm onOpen={handleOpen} loading={processing} />
        </div>
      )}
      {loadingDetail && (
        <p className="mb-3 text-sm text-gray-500">
          Cargando detalle de caja...
        </p>
      )}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Historial de caja
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Aperturas y cierres registrados en el sistema.
          </p>
        </div>

        <CashHistoryTable sessions={sessions} onView={handleViewSession} />
      </div>
      {selectedSession && (
        <CashSessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
