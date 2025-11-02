/**
 * FBP (Filtered Back Projection) Image Processing Core Module
 * Triển khai thuật toán FBP chuẩn cho tái tạo ảnh CT
 * Dựa trên scikit-image (radon, iradon) và OpenCV
 */

class FBPProcessor {
  constructor() {
    this.config = {
      maxImageSize: 256, // Giới hạn kích thước ảnh như trong Python
      defaultAngles: null, // Sẽ tính động dựa trên kích thước ảnh
      filterName: 'hann', // Filter mặc định như trong Python
      interpolation: 'cubic'
    };
  }

  /**
   * Tiền xử lý và khử nhiễu ảnh grayscale
   * Tương đương: preprocess_and_denoise()
   */
  preprocessAndDenoise(imageData, progressCallback = null) {
    if (progressCallback) progressCallback(0.1, "Đang chuẩn bị ảnh...");

    // Chuyển sang grayscale và normalize về [0, 1]
    const { width, height } = imageData;
    const imgFloat = new Float32Array(width * height);

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const gray = (
        0.299 * imageData.data[idx] +
        0.587 * imageData.data[idx + 1] +
        0.114 * imageData.data[idx + 2]
      ) / 255.0;
      imgFloat[i] = gray;
    }

    if (progressCallback) progressCallback(0.3, "Đang cân bằng histogram...");

    // Adaptive Histogram Equalization (CLAHE)
    const equalized = this._adaptiveHistogramEqualization(imgFloat, width, height);

    if (progressCallback) progressCallback(0.5, "Đang khử nhiễu ảnh...");

    // Non-local means denoising (simplified version)
    const denoised = this._nonLocalMeansDenoise(equalized, width, height);

    if (progressCallback) progressCallback(0.8, "Hoàn tất xử lý...");

    // Chuyển về uint8
    const result = new Uint8ClampedArray(width * height);
    for (let i = 0; i < denoised.length; i++) {
      result[i] = Math.round(denoised[i] * 255);
    }

    return { data: result, width, height };
  }

  /**
   * Tạo sinogram từ ảnh grayscale
   * Tương đương: create_sinogram()
   */
  createSinogram(imageData, progressCallback = null) {
    if (progressCallback) progressCallback(0.85, "Đang tạo sinogram...");

    const { width, height, data } = imageData;

    // Resize về max_size nếu cần
    const maxSize = this.config.maxImageSize;
    const scale = Math.min(maxSize / height, maxSize / width, 1.0);

    let resizedWidth, resizedHeight, resizedData;

    if (scale < 1.0) {
      resizedWidth = Math.round(width * scale);
      resizedHeight = Math.round(height * scale);
      resizedData = this._resizeImage(data, width, height, resizedWidth, resizedHeight);
    } else {
      resizedWidth = width;
      resizedHeight = height;
      resizedData = data;
    }

    // Normalize về [0, 1]
    const imgFloat = new Float32Array(resizedWidth * resizedHeight);
    for (let i = 0; i < imgFloat.length; i++) {
      imgFloat[i] = resizedData[i] / 255.0;
    }

    // Tính theta (angles)
    const numAngles = Math.max(resizedWidth, resizedHeight);
    const theta = new Float32Array(numAngles);
    for (let i = 0; i < numAngles; i++) {
      theta[i] = (180.0 * i) / numAngles; // 0 đến gần 180 độ
    }

    // Thực hiện Radon Transform
    const sinoRaw = this._radonTransform(
      imgFloat,
      resizedWidth,
      resizedHeight,
      theta
    );

    // Chuẩn hóa sinogram để hiển thị
    const sinoMin = Math.min(...sinoRaw);
    const sinoMax = Math.max(...sinoRaw);
    const sinoDisplay = new Uint8ClampedArray(sinoRaw.length);

    if (sinoMax > sinoMin) {
      for (let i = 0; i < sinoRaw.length; i++) {
        sinoDisplay[i] = Math.round(((sinoRaw[i] - sinoMin) / (sinoMax - sinoMin)) * 255);
      }
    } else {
      sinoDisplay.fill(0);
    }

    if (progressCallback) progressCallback(0.95, "Hoàn thành sinogram");

    // Sinogram có chiều cao = numAngles, chiều rộng = số detector
    const numDetectors = sinoRaw.length / numAngles;

    return {
      raw: sinoRaw, // Float32Array - dữ liệu thô để tái tạo
      theta: theta, // Các góc chiếu
      display: sinoDisplay, // Uint8ClampedArray - để hiển thị
      width: numDetectors,
      height: numAngles,
      originalShape: [resizedHeight, resizedWidth]
    };
  }

  /**
   * Tái tạo ảnh từ sinogram bằng Filtered Back Projection
   * Tương đương: reconstruct_image()
   */
  reconstructImage(sinogram, progressCallback = null) {
    if (progressCallback) progressCallback(0.97, "Đang tái tạo ảnh CT...");

    // Áp dụng filter (Ram-Lak với Hann window)
    const filteredSino = this._applyFilter(
      sinogram.raw,
      sinogram.width,
      sinogram.height,
      this.config.filterName
    );

    // Back-projection
    const [targetHeight, targetWidth] = sinogram.originalShape;
    const reconstruction = this._iradon(
      filteredSino,
      sinogram.width,
      sinogram.height,
      sinogram.theta,
      targetHeight,
      targetWidth
    );

    // Chuẩn hóa về [0, 255]
    const reconMin = Math.min(...reconstruction);
    const reconMax = Math.max(...reconstruction);
    const reconstructionUint8 = new Uint8ClampedArray(reconstruction.length);

    if (reconMax > reconMin) {
      for (let i = 0; i < reconstruction.length; i++) {
        reconstructionUint8[i] = Math.round(
          ((reconstruction[i] - reconMin) / (reconMax - reconMin)) * 255
        );
      }
    } else {
      reconstructionUint8.fill(128);
    }

    if (progressCallback) progressCallback(1.0, "Hoàn tất tái tạo");

    return {
      data: reconstructionUint8,
      width: targetWidth,
      height: targetHeight
    };
  }

  /**
   * Tạo sinogram từ ảnh sinogram đã có (inverse mode)
   * Tương đương: sinogram_from_image_array()
   */
  sinogramFromImageArray(sinogramImg, targetShape = null) {
    const { width, height, data } = sinogramImg;

    // Normalize về [0, 1]
    const sinoFloat = new Float32Array(width * height);
    for (let i = 0; i < sinoFloat.length; i++) {
      sinoFloat[i] = data[i] / 255.0;
    }

    // Tính theta
    const theta = new Float32Array(height);
    for (let i = 0; i < height; i++) {
      theta[i] = (180.0 * i) / height;
    }

    // Target shape
    if (!targetShape) {
      const side = width;
      targetShape = [side, side];
    }

    return {
      raw: sinoFloat,
      theta: theta,
      display: data,
      width: width,
      height: height,
      originalShape: targetShape
    };
  }

  /**
   * Lấy thông tin ảnh
   * Tương đương: get_image_info()
   */
  getImageInfo(imageData) {
    const { width, height, data } = imageData;
    let min = 255, max = 0;

    for (let i = 0; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }

    return {
      "Kích thước": `${width} x ${height} pixels`,
      "Độ sâu": data instanceof Uint8ClampedArray ? "uint8" : "float32",
      "Kênh màu": "Grayscale",
      "Min/Max": `${min} / ${max}`
    };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Radon Transform - Chiếu song song
   * Tương đương với skimage.transform.radon()
   */
  _radonTransform(image, width, height, theta) {
    const numAngles = theta.length;
    const diagonal = Math.ceil(Math.sqrt(width * width + height * height));
    const sinogram = new Float32Array(diagonal * numAngles);

    const centerX = width / 2.0;
    const centerY = height / 2.0;

    for (let angleIdx = 0; angleIdx < numAngles; angleIdx++) {
      const angle = (theta[angleIdx] * Math.PI) / 180.0;
      const cosTheta = Math.cos(angle);
      const sinTheta = Math.sin(angle);

      for (let t = 0; t < diagonal; t++) {
        const rho = t - diagonal / 2.0;
        let sum = 0;
        let count = 0;

        // Lấy mẫu dọc theo đường vuông góc với tia chiếu
        const numSamples = Math.max(width, height);
        const step = Math.max(width, height) / numSamples;

        for (let s = -numSamples / 2; s < numSamples / 2; s++) {
          const sPos = s * step;
          const x = centerX + rho * cosTheta - sPos * sinTheta;
          const y = centerY + rho * sinTheta + sPos * cosTheta;

          if (x >= 0 && x < width - 1 && y >= 0 && y < height - 1) {
            const value = this._bilinearInterpolate(image, x, y, width, height);
            sum += value;
            count++;
          }
        }

        sinogram[angleIdx * diagonal + t] = count > 0 ? sum : 0;
      }
    }

    return sinogram;
  }

  /**
   * Filtered Back Projection - Iradon
   * Tương đương với skimage.transform.iradon()
   */
  _iradon(sinogram, sinoWidth, sinoHeight, theta, targetHeight, targetWidth) {
    const numAngles = sinoHeight;
    const numDetectors = sinoWidth;
    const image = new Float32Array(targetHeight * targetWidth).fill(0);

    const centerX = targetWidth / 2.0;
    const centerY = targetHeight / 2.0;
    const detectorCenter = numDetectors / 2.0;

    for (let angleIdx = 0; angleIdx < numAngles; angleIdx++) {
      const angle = (theta[angleIdx] * Math.PI) / 180.0;
      const cosTheta = Math.cos(angle);
      const sinTheta = Math.sin(angle);

      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          // Tính vị trí detector
          const dx = x - centerX;
          const dy = y - centerY;
          const t = dx * cosTheta + dy * sinTheta + detectorCenter;

          if (t >= 0 && t < numDetectors - 1) {
            const value = this._linearInterpolate(
              sinogram,
              angleIdx * numDetectors,
              t,
              numDetectors
            );
            image[y * targetWidth + x] += value;
          }
        }
      }
    }

    // Normalize theo số góc
    const normFactor = Math.PI / (2.0 * numAngles);
    for (let i = 0; i < image.length; i++) {
      image[i] *= normFactor;
    }

    return image;
  }

  /**
   * Áp dụng filter trong frequency domain
   * Sử dụng Ram-Lak filter với window (Hann, Hamming, etc.)
   */
  _applyFilter(sinogram, width, height, filterName) {
    const filtered = new Float32Array(width * height);
    const filter = this._createRamLakFilter(width, filterName);

    for (let row = 0; row < height; row++) {
      const projection = sinogram.slice(row * width, (row + 1) * width);
      const filteredProj = this._convolve1D(projection, filter);

      for (let col = 0; col < width; col++) {
        filtered[row * width + col] = filteredProj[col];
      }
    }

    return filtered;
  }

  /**
   * Tạo Ram-Lak (Ramp) filter với window
   * filterName: 'ramp', 'hann', 'hamming', 'shepp-logan', 'cosine'
   */
  _createRamLakFilter(size, filterName) {
    const filter = new Float32Array(size);
    const center = Math.floor(size / 2);

    // Ram-Lak (Ramp) filter cơ bản
    for (let i = 0; i < size; i++) {
      const n = i - center;
      if (n === 0) {
        filter[i] = 0.25;
      } else if (n % 2 === 0) {
        filter[i] = 0;
      } else {
        filter[i] = -1.0 / (Math.PI * Math.PI * n * n);
      }
    }

    // Áp dụng window function
    switch (filterName.toLowerCase()) {
      case 'hann':
        for (let i = 0; i < size; i++) {
          const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
          filter[i] *= w;
        }
        break;

      case 'hamming':
        for (let i = 0; i < size; i++) {
          const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1));
          filter[i] *= w;
        }
        break;

      case 'shepp-logan':
      case 'cosine':
        for (let i = 0; i < size; i++) {
          const n = i - center;
          if (n !== 0) {
            const x = (Math.PI * n) / size;
            const sinc = Math.sin(x) / x;
            filter[i] *= sinc;
          }
        }
        break;

      case 'ramp':
      default:
        // Giữ nguyên
        break;
    }

    return filter;
  }

  /**
   * 1D Convolution
   */
  _convolve1D(signal, kernel) {
    const result = new Float32Array(signal.length);
    const halfKernel = Math.floor(kernel.length / 2);

    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      for (let j = 0; j < kernel.length; j++) {
        const idx = i - halfKernel + j;
        if (idx >= 0 && idx < signal.length) {
          sum += signal[idx] * kernel[j];
        }
      }
      result[i] = sum;
    }

    return result;
  }

  /**
   * Bilinear Interpolation
   */
  _bilinearInterpolate(image, x, y, width, height) {
    const x0 = Math.floor(x);
    const x1 = Math.min(x0 + 1, width - 1);
    const y0 = Math.floor(y);
    const y1 = Math.min(y0 + 1, height - 1);

    const wx = x - x0;
    const wy = y - y0;

    const v00 = image[y0 * width + x0];
    const v10 = image[y0 * width + x1];
    const v01 = image[y1 * width + x0];
    const v11 = image[y1 * width + x1];

    const top = v00 * (1 - wx) + v10 * wx;
    const bottom = v01 * (1 - wx) + v11 * wx;

    return top * (1 - wy) + bottom * wy;
  }

  /**
   * Linear Interpolation (1D)
   */
  _linearInterpolate(array, offset, index, length) {
    const i0 = Math.floor(index);
    const i1 = Math.min(i0 + 1, length - 1);
    const w = index - i0;

    const v0 = array[offset + i0];
    const v1 = array[offset + i1];

    return v0 * (1 - w) + v1 * w;
  }

  /**
   * Adaptive Histogram Equalization (CLAHE simplified)
   */
  _adaptiveHistogramEqualization(image, width, height, clipLimit = 0.02) {
    // Simplified version - chỉ làm global histogram equalization
    const hist = new Array(256).fill(0);
    
    // Tính histogram
    for (let i = 0; i < image.length; i++) {
      const bin = Math.floor(image[i] * 255);
      hist[bin]++;
    }

    // Cumulative distribution
    const cdf = new Array(256);
    cdf[0] = hist[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + hist[i];
    }

    // Normalize CDF
    const cdfMin = cdf.find(v => v > 0);
    const total = width * height;
    const equalized = new Float32Array(image.length);

    for (let i = 0; i < image.length; i++) {
      const bin = Math.floor(image[i] * 255);
      equalized[i] = (cdf[bin] - cdfMin) / (total - cdfMin);
    }

    return equalized;
  }

  /**
   * Non-local Means Denoising (simplified)
   */
  _nonLocalMeansDenoise(image, width, height, patchSize = 3, h = 0.05) {
    const denoised = new Float32Array(image.length);
    const halfPatch = Math.floor(patchSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumWeights = 0;
        let sumValues = 0;

        // Search window (simplified - just local neighborhood)
        for (let dy = -halfPatch; dy <= halfPatch; dy++) {
          for (let dx = -halfPatch; dx <= halfPatch; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              // Simplified weight calculation
              const dist = Math.sqrt(dx * dx + dy * dy) / patchSize;
              const weight = Math.exp(-(dist * dist) / (h * h));

              sumWeights += weight;
              sumValues += weight * image[ny * width + nx];
            }
          }
        }

        denoised[y * width + x] = sumWeights > 0 ? sumValues / sumWeights : image[y * width + x];
      }
    }

    return denoised;
  }

  /**
   * Resize image (simple area interpolation)
   */
  _resizeImage(data, oldWidth, oldHeight, newWidth, newHeight) {
    const resized = new Uint8ClampedArray(newWidth * newHeight);
    const scaleX = oldWidth / newWidth;
    const scaleY = oldHeight / newHeight;

    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.min(Math.floor(x * scaleX), oldWidth - 1);
        const srcY = Math.min(Math.floor(y * scaleY), oldHeight - 1);
        resized[y * newWidth + x] = data[srcY * oldWidth + srcX];
      }
    }

    return resized;
  }

  /**
   * Đánh giá chất lượng tái tạo
   */
  evaluateReconstruction(original, reconstructed) {
    const metrics = {
      psnr: 0,
      mse: 0,
      mae: 0,
      snr: 0
    };

    const n = Math.min(original.length / 4, reconstructed.data.length);
    let mse = 0;
    let mae = 0;
    let signalPower = 0;

    for (let i = 0; i < n; i++) {
      const orig = original[i * 4]; // R channel từ RGBA
      const recon = reconstructed.data[i];
      const diff = orig - recon;

      mse += diff * diff;
      mae += Math.abs(diff);
      signalPower += orig * orig;
    }

    mse /= n;
    mae /= n;
    signalPower /= n;

    metrics.mse = mse;
    metrics.mae = mae;
    metrics.psnr = mse === 0 ? 100 : 10 * Math.log10((255 * 255) / mse);
    metrics.snr = signalPower === 0 ? 0 : 10 * Math.log10(signalPower / mse);

    return metrics;
  }
}

// Export để sử dụng trong module khác
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FBPProcessor;
}
if (typeof window !== 'undefined') {
  window.FBPProcessor = FBPProcessor;
}
