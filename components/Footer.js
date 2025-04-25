import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#E8E8EA] mt-auto dark:bg-[#141624] px-6 sm:px-16 md:px-20 lg:px-28 padding">
      <div className="flex lg:flex-row flex-col-reverse justify-between">
        <p className="text-[#667085] m-2 text-center dark:text-[#C0C5D0] font-semibold text-base">
          © Vignesh A S {year}. All Rights Reserved.
        </p>

        <ul className="flex lg:flex-row flex-col center gap-4 lg:gap-8">
          {["Terms of Use", "Privacy Policy", "Cookie Policy"].map(
            (item, i) => (
              <li
                className="text-[#667085] cursor-pointer dark:hover:text-white hover:text-black
                 text-justify dark:text-[#C0C5D0] font-semibold text-base"
                key={i}
              >
                {item}
              </li>
            )
          )}
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
