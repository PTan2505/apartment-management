import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import { MOBILE_BREAKPOINT } from "@/app/theme";
import { AddressCandidates } from "@/features/addresses/AddressCandidates";
import { resolveAddress } from "@/features/addresses/api";
import { useAddressLookupAvailable } from "@/features/addresses/hooks";
import {
  useCreateBuilding,
  useUpdateBuilding,
} from "@/features/buildings/hooks";
import {
  buildingFormSchema,
  type BuildingFormOutput,
  type BuildingFormValues,
} from "@/features/buildings/schema";
import type { Building } from "@/features/buildings/types";
import { isApiError } from "@/lib/api-error";
import { InputAdornment } from "@mui/material";

interface BuildingFormDialogProps {
  open: boolean;
  /** The building being edited, or null to create a new one. */
  building: Building | null;
  onClose: () => void;
  /** Called after a create (not an edit) so the list can reveal the new row. */
  onCreated?: () => void;
}

const EMPTY: BuildingFormValues = {
  displayName: "",
  address: "",
  ward: "",
  city: "",
  country: "Vietnam",
  electricityRate: 0,
  waterRatePerPerson: 0,
  placeId: null,
};

export function BuildingFormDialog({
  open,
  building,
  onClose,
  onCreated,
}: BuildingFormDialogProps) {
  const theme = useTheme();
  // Unlike the shell's drawers, a dialog is not painted until it opens, so a
  // first-render false here cannot flash the wrong layout.
  const fullScreen = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT));

  const createMutation = useCreateBuilding();
  const updateMutation = useUpdateBuilding();
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = building !== null;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  /**
   * Whether the address fields describe a place that was chosen.
   *
   * Unlocked is the default and the fallback: hand entry always works, which is
   * what keeps an optional, sometimes-wrong, sometimes-absent lookup from being
   * a prerequisite for creating a building.
   */
  const [locked, setLocked] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const lookup = useAddressLookupAvailable();

  /**
   * Groups a run of searches with the resolution that follows, so the provider
   * bills one session per address rather than one per keystroke. Regenerated
   * each time the dialog opens, since that is one address entry.
   */
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: EMPTY,
  });

  // The street address field is the search. Its value updates the form on every
  // keystroke — so a fast submit is never missing what was typed — while only
  // the *lookup* waits for typing to settle.
  const addressValue = watch("address") ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    if (locked) return;
    const timer = setTimeout(() => setSearchTerm(addressValue), 350);
    return () => clearTimeout(timer);
  }, [addressValue, locked]);

  /**
   * MUI floats a label only when it believes the field has content, and it does
   * not know about a value written by `setValue`. Without this the label sits
   * on top of the filled text.
   */
  const shrink = (name: "address" | "ward" | "city" | "country") =>
    Boolean(watch(name)) || undefined;

  /**
   * Unlocking drops the recorded place: `placeId` claims these values came from
   * it, and once they can be edited that claim no longer holds.
   */
  function unlockAddress() {
    setValue("placeId", null);
    setResolveError(null);
    setLocked(false);
    // Editing resumes from what is there; do not re-search it unprompted.
    setSearchTerm("");
  }

  async function handleChooseAddress(candidate: { placeId: string }) {
    setResolveError(null);
    setIsResolving(true);
    try {
      const address = await resolveAddress(candidate.placeId, sessionToken);
      // These are what will be saved, and the next state shows them — the owner
      // sees the values rather than only the description they picked.
      setValue("address", address.address, { shouldValidate: true });
      setValue("ward", address.ward, { shouldValidate: true });
      setValue("city", address.city, { shouldValidate: true });
      setValue("country", address.country, { shouldValidate: true });
      setValue("placeId", address.placeId);
      setLocked(true);
      // Stop the newly filled street from immediately searching for itself.
      setSearchTerm("");
    } catch (error) {
      // Resolving failed after the place was chosen. Manual entry is the way
      // through, so say so rather than leaving a search that led nowhere.
      setResolveError(
        isApiError(error)
          ? `${error.message} You can enter the address manually.`
          : "Could not load that address. You can enter it manually.",
      );
    } finally {
      setIsResolving(false);
    }
  }

  // Refill whenever the dialog opens, so editing one building then another does
  // not show the previous one's values.
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setResolveError(null);
    setSessionToken(crypto.randomUUID());
    reset(
      building
        ? {
            displayName: building.displayName,
            address: building.address,
            ward: building.ward,
            city: building.city,
            country: building.country,
            electricityRate: building.electricityRate,
            waterRatePerPerson: building.waterRatePerPerson,
            placeId: building.placeId,
          }
        : EMPTY,
    );
    // Always unlocked on open. An existing building's address is editable
    // whether or not it was once resolved: it is recorded data now, and the
    // useful action on it is correction.
    setLocked(false);
  }, [open, building, reset]);

  async function onSubmit(values: BuildingFormValues) {
    setFormError(null);
    const input = buildingFormSchema.parse(values) satisfies BuildingFormOutput;
    try {
      if (building) {
        await updateMutation.mutateAsync({ id: building.id, input });
      } else {
        await createMutation.mutateAsync(input);
        onCreated?.();
      }
      onClose();
    } catch (error) {
      if (!isApiError(error)) {
        setFormError("Something went wrong. Please try again.");
        return;
      }
      // The API names the fields it rejected; attribute them rather than
      // showing one opaque message above a form the user must now re-read.
      const fieldErrors = error.fieldErrors;
      let attributed = false;
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (field in EMPTY && messages[0]) {
          setError(field as keyof BuildingFormValues, {
            type: "server",
            message: messages[0],
          });
          attributed = true;
        }
      }
      if (!attributed) setFormError(error.message);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{isEdit ? "Edit building" : "New building"}</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Stack
          spacing={2}
          component="form"
          id="building-form"
          // The rate inputs carry min={0}, which makes the browser block
          // submission itself — before react-hook-form runs, so the form's own
          // message never appears and the user sees a native tooltip or nothing.
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 1 }}
        >
          <TextField
            label="Name"
            fullWidth
            autoFocus
            error={Boolean(errors.displayName)}
            helperText={errors.displayName?.message}
            {...register("displayName")}
          />
          {/* ── Address ──────────────────────────────────────────────────
              The street address field is also the search: typing an address
              looks for it, and choosing a suggestion fills the ward, city and
              country beneath. All four stay visible and are editable by
              default, so a building can always be entered by hand — lookup is
              optional and its data is incomplete.

              Choosing a place locks the four, since they then describe that
              place. Unlocking discards the recorded place, because the values
              may no longer be the ones it supplied. */}
          {lookup.notConfigured && (
            <Alert severity="info">
              Address lookup is not configured on this server. Type the address
              below.
            </Alert>
          )}

          {isResolving && (
            <Alert severity="info" icon={<CircularProgress size={16} />}>
              Loading the chosen address…
            </Alert>
          )}

          {resolveError && <Alert severity="warning">{resolveError}</Alert>}

          {locked && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Address filled from the place you chose.
              </Typography>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={unlockAddress}
              >
                Edit manually
              </Link>
            </Box>
          )}

          <Box>
            <TextField
              label="Street address"
              fullWidth
              error={Boolean(errors.address)}
              helperText={
                errors.address?.message ??
                (lookup.available && !locked
                  ? "Start typing to search, or enter it yourself"
                  : "House number and street only")
              }
              slotProps={{
                input: { readOnly: locked },
                inputLabel: { shrink: shrink("address") },
              }}
              {...register("address")}
            />
            {lookup.available && !locked && (
              <AddressCandidates
                term={searchTerm}
                sessionToken={sessionToken}
                onChoose={handleChooseAddress}
              />
            )}
          </Box>

          <TextField
            label="Ward"
            fullWidth
            error={Boolean(errors.ward)}
            helperText={errors.ward?.message}
            slotProps={{
              input: { readOnly: locked },
              inputLabel: { shrink: shrink("ward") },
            }}
            {...register("ward")}
          />
          <TextField
            label="City"
            fullWidth
            error={Boolean(errors.city)}
            helperText={errors.city?.message}
            slotProps={{
              input: { readOnly: locked },
              inputLabel: { shrink: shrink("city") },
            }}
            {...register("city")}
          />
          <TextField
            label="Country"
            fullWidth
            error={Boolean(errors.country)}
            helperText={errors.country?.message}
            slotProps={{
              input: { readOnly: locked },
              inputLabel: { shrink: shrink("country") },
            }}
            {...register("country")}
          />

          <TextField
            label="Electricity rate"
            type="number"
            fullWidth
            onFocus={(e) => e.target.select()}
            // `any` allows the fractional rates the API records.
            slotProps={{
              htmlInput: { step: "any", min: 0 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">VND / kWh</InputAdornment>
                ),
              },
            }}
            error={Boolean(errors.electricityRate)}
            helperText={errors.electricityRate?.message ?? "Đồng per kWh"}
            {...register("electricityRate", { valueAsNumber: true })}
          />
          <TextField
            label="Water rate"
            type="number"
            fullWidth
            onFocus={(e) => e.target.select()}
            slotProps={{
              htmlInput: { step: "any", min: 0 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    VND / người / tháng
                  </InputAdornment>
                ),
              },
            }}
            error={Boolean(errors.waterRatePerPerson)}
            helperText={
              errors.waterRatePerPerson?.message ?? "Đồng per person per month"
            }
            {...register("waterRatePerPerson", { valueAsNumber: true })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="building-form"
          variant="contained"
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : undefined
          }
        >
          {isSubmitting ? "Saving…" : isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
