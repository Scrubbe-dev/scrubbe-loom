"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import { VscChevronDown, VscChevronUp } from "react-icons/vsc";
import { RiSearchLine } from "react-icons/ri";
import { FiGlobe } from "react-icons/fi";
import SearchModal from "./SearchModal";

type MenuItem = {
  label: string;
  href?: string;
  dropdownOptions?: {
    label: string;
    href: string;
    description?: string; // Adding optional description field
  }[];
};

const Navbar = () => {
  // Existing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {}
  );
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const textColor = "text-gray-800";

  // Toggle dropdown visibility in mobile menu
  const toggleMobileDropdown = (label: string) => {
    setExpandedMenus((prev) => {
      // If the clicked menu is already open, close it
      if (prev[label]) {
        return {
          ...prev,
          [label]: false,
        };
      }

      // Otherwise, close all menus and open the clicked one
      const newState: Record<string, boolean> = {};
      menuItems.forEach((item) => {
        if (item.dropdownOptions) {
          newState[item.label] = false;
        }
      });

      return {
        ...newState,
        [label]: true,
      };
    });
  };

  // Menu items configuration
  const menuItems: MenuItem[] = [
    {
      label: "Products",
      dropdownOptions: [
        {
          label: "SIEM Platform",
          href: "#",
          description:
            "Real-time threat detection, log analysis, and centralized monitoring",
        },
        {
          label: "SOAR Automation",
          href: "#",
          description:
            "Automated workflows to respond to incidents faster and smarter",
        },
        {
          label: "Incident Management",
          href: "#",
          description:
            "End-to-end visibility, manage security events from detection to resolution",
        },
        {
          label: "Fraud Detection",
          href: "#",
          description:
            "Tools to detect and block suspicious behavior across digital platforms",
        },
        {
          label: "Authentication SDK",
          href: "#",
          description:
            "Secure user and system authentication for integrated apps",
        },
        {
          label: "Compliance Tools",
          href: "#",
          description:
            "Automate reporting and meet standards like SOC 2, ISO 27001",
        },
        {
          label: "Dashboard Preview",
          href: "#",
          description:
            "Get a sneak peak of the Scrubbe control center in action",
        },
      ],
    },
    {
      label: "Solutions",
      dropdownOptions: [
        {
          label: "For Fintech",
          href: "#",
          description: "Monitor Fraud, ensure compliance and Scale securely",
        },
        {
          label: "For SaaS Companies",
          href: "#",
          description:
            "Protect customer data and respond to security threats in real time",
        },
        {
          label: "For Security Teams",
          href: "#",
          description:
            "Centralize visibility, automate playbooks, and reduce manual triage",
        },
        {
          label: "Real-time Threat Monitoring",
          href: "#",
          description: "Spot and act on threats as they happen",
        },
        {
          label: "KYC & Fraud Protection",
          href: "#",
          description:
            "Detect identity fraud and malicious account behavior early",
        },
      ],
    },
    {
      label: "Documentation",
      dropdownOptions: [
        {
          label: "Fraud APIs",
          href: "#",
          description:
            "Fraud-aware APIs equipped with tools to monitor, detect and block suspicious behavior across digital platforms",
        },
        {
          label: "Authentication SDK",
          href: "#",
          description:
            "Secure user and system with scrubbe authentication with features",
        },
      ],
    },
    {
      label: "Pricing",
      dropdownOptions: [
        {
          label: "Authentication SDK Pricing",
          href: "#",
        },
        {
          label: "SIEM and SOAR Monitoring Pricing",
          href: "#",
        },
        {
          label: "Talk To Sales",
          href: "#",
        },
      ],
    },
    {
      label: "More",
      dropdownOptions: [
        { label: "Knowledge base", href: "#" },
        { label: "Security and Trust", href: "#" },
        { label: "Case Studies", href: "#" },
        { label: "Blog (Technical and Industry Post)", href: "#" },
        { label: "White Papers", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Compliance Checklist", href: "#" },
        { label: "About Us", href: "#" },
      ],
    },
  ];

  // Handle search button click
  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  return (
    <>
      {/* Navbar Container */}
      <section className="w-full h-auto bg-white flex justify-center">
        <nav
          className={`flex ${textColor} h-16 w-full max-w-[1440px] justify-between items-center px-4 md:px-6 lg:px-10 xl:px-20 sticky top-0 z-50 bg-white shadow-sm`}
        >
          {/* Logo */}
          <Link
            href="/"
            className="relative  w-[141px] h-[40px] sm:w-[176px] sm:h-[50px] lg:w-[211px] lg:h-[60px]"
          >
            <Image
              src="/scrubbe-logo-01.png"
              alt="scrubbe-logo-01.png"
              fill
              sizes="(min-width: 360px) 100vw"
              className="object-contain"
            />
          </Link>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
              onClick={handleSearchClick}
            >
              <RiSearchLine size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">
              <FiGlobe size={20} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <GiHamburgerMenu size={20} />
            </button>
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden lg:flex items-center justify-center flex-1 ml-8">
            {menuItems.map((item) => (
              <div key={item.label} className="relative group px-4">
                {item.dropdownOptions ? (
                  <>
                    <button
                      className={`${textColor} hover:text-blue-600 transition-colors flex justify-center items-center cursor-pointer whitespace-nowrap py-2`}
                    >
                      {item.label} <VscChevronDown className="ml-1" />
                    </button>

                    <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg min-w-[220px] z-50 border border-gray-200 py-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                      {item.dropdownOptions.map((option) => (
                        <Link
                          key={option.label}
                          href={option.href}
                          className={`block px-4 py-2 ${textColor} hover:bg-blue-600 hover:text-white transition-colors text-sm`}
                        >
                          {option.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href || "#"}
                    className={`${textColor} hover:text-blue-600 transition-colors flex justify-center items-center cursor-pointer whitespace-nowrap py-2`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Right Menu */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
              onClick={handleSearchClick}
            >
              <RiSearchLine size={24} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">
              <FiGlobe size={24} />
            </button>
            <Link
              href="/auth"
              className="px-6 py-2 text-[#ebeaff] bg-[#2463e9] rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap focus:outline-none"
            >
              Login
            </Link>
          </div>
        </nav>

        {/* Mobile Menu Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-white z-50 lg:hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 h-16 border-b border-gray-200">
              <Link
                href="/"
                onClick={() => setIsModalOpen(false)}
                className="relative  w-[141px] h-[40px] sm:w-[176px] sm:h-[50px] lg:w-[211px] lg:h-[60px]"
              >
                <Image
                  src="/scrubbe-logo-01.png"
                  alt="scrubbe-logo-01.png"
                  fill
                  sizes="(min-width: 360px) 100vw"
                  className="object-contain"
                />
              </Link>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <IoMdClose size={24} className={textColor} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-6 space-y-4 overflow-y-auto max-h-[calc(100vh-64px)]">
              {menuItems.map((item) => (
                <div key={item.label} className="w-full">
                  {item.dropdownOptions ? (
                    <>
                      <button
                        onClick={() => toggleMobileDropdown(item.label)}
                        className={`flex items-center justify-between w-full text-lg font-medium ${textColor} hover:text-blue-600 transition-colors py-2`}
                      >
                        <span>{item.label}</span>
                        {expandedMenus[item.label] ? (
                          <VscChevronUp className="ml-2" />
                        ) : (
                          <VscChevronDown className="ml-2" />
                        )}
                      </button>

                      {expandedMenus[item.label] && (
                        <div className="mt-1 bg-gray-50 rounded-lg overflow-hidden">
                          {item.dropdownOptions.map((option) => (
                            <Link
                              key={option.label}
                              href={option.href}
                              onClick={() => setIsModalOpen(false)}
                              className={`block px-4 py-3 ${textColor} hover:bg-blue-600 hover:text-white transition-colors text-base`}
                            >
                              {option.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      onClick={() => setIsModalOpen(false)}
                      className={`block py-2 text-lg font-medium ${textColor} hover:text-blue-600 transition-colors`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              <div className="pt-6 border-t border-gray-200">
                <Link
                  href="/auth"
                  onClick={() => setIsModalOpen(false)}
                  className="block w-full text-center py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:outline-none text-lg font-medium"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Search Modal Component */}
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      </section>
    </>
  );
};

export default Navbar;
