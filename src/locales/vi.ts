import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const VI: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} không được để trống`,
  invalid_type: (i) => `Mong đợi {exp}, nhưng nhận được {rec}`,
  invalid_literal: (i) => `Phải là {lit}`,
  invalid_enum_value: (i) => `Phải là một trong: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `Phải đúng {n} ký tự` : `Tối thiểu {n} ký tự`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `Phải đúng {n}` : `Tối thiểu là {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Cần ít nhất {n} mục`;
    }
    return `Giá trị quá nhỏ`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `Phải đúng {n} ký tự` : `Tối đa {n} ký tự`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `Phải đúng {n}` : `Tối đa là {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `Tối đa {n} mục`;
    }
    return `Giá trị quá lớn`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `Email này không hợp lệ`;
    if (i.validation === "url") return `URL này không hợp lệ`;
    if (i.validation === "uuid") return `UUID này không hợp lệ`;
    if (i.validation === "regex") return `Định dạng không đúng`;
    if (i.validation === "alpha") return `Chỉ được chứa chữ cái`;
    if (i.validation === "numeric") return `Chỉ được chứa số`;
    if (i.validation === "symbol") return `Chỉ được chứa ký hiệu, không có chữ hoặc số`;
    if (i.validation === "phone") return `Số điện thoại không hợp lệ`;
    return `Định dạng không hợp lệ`;
  },
  invalid_number: () => `Nhập số hợp lệ`,
  invalid_date: () => `Nhập ngày hợp lệ`,
  invalid_array: () => `Mong đợi một danh sách`,
  invalid_union: () => `Không khớp với định dạng nào`,
  invalid_intersection: () => `Chưa đáp ứng hết yêu cầu`,
  invalid_discriminator: (i) => `Loại "{disc}" không xác định. Mong đợi: {allowed}`,
  unknown_keys: (i) => `Trường không mong đợi: {keys}`,
  invalid_tuple_length: (i) => `Mong đợi {min} mục, nhận {max}`,
  custom: () => `Giá trị này không hợp lệ`,
};
