import type { WorkerType } from "@/models/worker";

type WorkerLike = {
  _id?: {
    toString(): string;
  };
  name: string;
  role?: string | null;
  workerType?: WorkerType | null;
  salary?: number | null;
  phoneNumber?: string | null;
  joiningDate?: Date | string | null;
  createdAt?: Date | string | null;
};

const NAME_PRIORITY = new Map<string, number>([["rajiv kumar garg", -100]]);

const ROLE_PRIORITY = new Map<string, number>([
  ["proprietor", 0],
  ["owner", 0],
  ["founder", 0],
  ["manager", 1],
  ["supervisor", 2],
  ["accountant", 3],
  ["driver", 4],
  ["operator", 5],
  ["helper", 6],
  ["dihadi", 99],
]);

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeWorkerIdentityName(name: string | null | undefined) {
  return normalizeText(name);
}

export function resolveWorkerType(worker: WorkerLike): WorkerType {
  if (worker.workerType === "permanent" || worker.workerType === "dihadi") {
    return worker.workerType;
  }

  return normalizeText(worker.role) === "dihadi" ? "dihadi" : "permanent";
}

export function getWorkerRoleLabel(worker: WorkerLike) {
  if (resolveWorkerType(worker) === "dihadi" && normalizeText(worker.role) === "dihadi") {
    return "Dihadi Worker";
  }

  return worker.role?.trim() || "Worker";
}

export function hasDisplayPhoneNumber(phoneNumber: string | null | undefined) {
  const normalizedPhone = normalizeText(phoneNumber);
  return Boolean(normalizedPhone) && normalizedPhone !== "n/a";
}

function getWorkerSortPriority(worker: WorkerLike) {
  const normalizedName = normalizeText(worker.name);
  const prioritizedNameWeight = NAME_PRIORITY.get(normalizedName);

  if (typeof prioritizedNameWeight === "number") {
    return prioritizedNameWeight;
  }

  const rolePriority = ROLE_PRIORITY.get(normalizeText(worker.role)) ?? 50;
  const workerTypeOffset = resolveWorkerType(worker) === "dihadi" ? 100 : 0;

  return rolePriority + workerTypeOffset;
}

export function sortWorkersForAdmin<T extends WorkerLike>(workers: T[]) {
  return [...workers].sort((first, second) => {
    const priorityDifference =
      getWorkerSortPriority(first) - getWorkerSortPriority(second);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const roleDifference = normalizeText(first.role).localeCompare(
      normalizeText(second.role),
    );

    if (roleDifference !== 0) {
      return roleDifference;
    }

    return normalizeText(first.name).localeCompare(normalizeText(second.name));
  });
}

function getDateTimeValue(value: Date | string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

export function groupDihadiWorkersByName<T extends WorkerLike>(workers: T[]) {
  const groupedWorkers = new Map<string, T[]>();

  workers.forEach((worker) => {
    if (resolveWorkerType(worker) !== "dihadi") {
      return;
    }

    const normalizedName = normalizeWorkerIdentityName(worker.name);
    const existingWorkers = groupedWorkers.get(normalizedName) ?? [];
    existingWorkers.push(worker);
    groupedWorkers.set(normalizedName, existingWorkers);
  });

  return Array.from(groupedWorkers.entries())
    .map(([normalizedName, members]) => {
      const sortedMembers = [...members].sort(
        (first, second) => getDateTimeValue(first.createdAt) - getDateTimeValue(second.createdAt),
      );
      const canonicalWorker = sortedMembers[0]!;

      return {
        canonicalWorker,
        members: sortedMembers,
        normalizedName,
        workerIds: sortedMembers
          .map((worker) => worker._id?.toString())
          .filter((workerId): workerId is string => Boolean(workerId)),
      };
    })
    .sort((first, second) =>
      sortWorkersForAdmin([first.canonicalWorker, second.canonicalWorker])[0] ===
      first.canonicalWorker
        ? -1
        : 1,
    );
}
