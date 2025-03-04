import React from "react";
import { useForm } from "react-hook-form";
import Button from "./Button";
import { toast } from "sonner";
import ModalWrapper from "./ModalWrapper";
import Textbox from "./Textbox";
import { useChangePasswordMutation } from "../redux/slices/api/userApiSlice";
import { Dialog } from "@headlessui/react"; //Ensure this component exists or replace it

const ChangePassword = ({ open, setOpen }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }, // ✅ Fixed formState typo
  } = useForm();

  const [changeUserPassword, { isLoading }] = useChangePasswordMutation();

  const handleOnSubmit = async (data) => {
    if (data.password !== data.cpass) {
      toast.warning("Passwords don't match");
      return;
    }
    try {
      await changeUserPassword(data).unwrap();
      toast.success("Password changed successfully"); // ✅ Fixed success message

      setTimeout(() => {
        setOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(handleOnSubmit)}>
        <Dialog.Title
          as="h2"
          className="text-base font-bold text-gray-900 mb-4"
        >
          Change Password
        </Dialog.Title>

        <div className="mt-3 flex flex-col gap-6">
          <Textbox
            placeholder="New Password" // ✅ Fixed typo
            type="password"
            name="password"
            label="New Password"
            className="w-full rounded"
            register={register("password", {
              required: "New Password is required!",
            })}
            error={errors.password ? errors.password.message : ""}
          />
          <Textbox
            placeholder="Confirm New Password"
            type="password"
            name="cpass"
            label="Confirm New Password"
            className="w-full rounded"
            register={register("cpass", {
              required: "Confirm New Password is required!",
            })}
            error={errors.cpass ? errors.cpass.message : ""}
          />
        </div>

        {isLoading ? (
          <div className="py-5">
            <isLoading />
          </div>
        ) : (
          <div className="py-3 mt-4 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              className="bg-blue-600 text-white px-8 font-semibold hover:bg-blue-700"
              label="Save"
            />
            <button
              type="button"
              className="bg-white text-sm font-semibold text-gray-900 sm:w-auto pr-5"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </ModalWrapper>
  );
};

export default ChangePassword;
