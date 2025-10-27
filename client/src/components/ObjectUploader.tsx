// Reference: blueprint:javascript_object_storage integration
// Object Uploader component for large video and image uploads
import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/css/style.css";
import "@uppy/dashboard/css/style.css";
import AwsS3 from "@uppy/aws-s3";
import { motion } from "framer-motion";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[]; // e.g., ['image/*', 'video/*']
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: any) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * Object Uploader component for uploading large video and image files
 * 
 * Features:
 * - Supports large file uploads (configurable)
 * - Provides modal interface for file selection and preview
 * - Shows upload progress
 * - Integrates with Replit Object Storage
 * 
 * @param props.maxNumberOfFiles - Maximum number of files (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 500MB for videos)
 * @param props.allowedFileTypes - Allowed file types (default: images and videos)
 * @param props.onGetUploadParameters - Function to get presigned upload URL
 * @param props.onComplete - Callback when upload completes
 * @param props.buttonClassName - Custom button class name
 * @param props.children - Button content
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 524288000, // 500MB default for video uploads
  allowedFileTypes = ['image/*', 'video/*'],
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: allowedFileTypes.length > 0 ? allowedFileTypes : undefined,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        setShowModal(false);
        onComplete?.(result);
      })
  );

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowModal(true)}
        className={buttonClassName || "bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"}
        data-testid="button-open-uploader"
      >
        {children}
      </motion.button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
