import React from "react";
import { useForm } from "react-hook-form";

export default function SampleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    // Convert photo file object to preview URL if needed
    console.log("Form Submitted:", data);
  };

  return (
    <div className="container mt-4">
      <h2>Student Registration Form</h2>
      <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
        {/* Roll No */}
        <div className="mb-3">
          <label className="form-label">Roll No</label>
          <input
            type="text"
            className="form-control"
            {...register("rollno", { required: "Roll No is required" })}
          />
          {errors.rollno && <small className="text-danger">{errors.rollno.message}</small>}
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && <small className="text-danger">{errors.name.message}</small>}
        </div>

        {/* Birthdate */}
        <div className="mb-3">
          <label className="form-label">Birthdate</label>
          <input
            type="date"
            className="form-control"
            {...register("birthdate", { required: "Birthdate is required" })}
          />
          {errors.birthdate && <small className="text-danger">{errors.birthdate.message}</small>}
        </div>

        {/* Gender */}
        <div className="mb-3">
          <label className="form-label">Gender</label>
          <select className="form-select" {...register("gender", { required: "Gender is required" })}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <small className="text-danger">{errors.gender.message}</small>}
        </div>

        {/* Photo */}
        <div className="mb-3">
          <label className="form-label">Photo</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            {...register("photo", { required: "Photo is required" })}
          />
          {errors.photo && <small className="text-danger">{errors.photo.message}</small>}
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
}
