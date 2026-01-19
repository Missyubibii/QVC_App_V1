import {
    AlertTriangle,
    Bell,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    Fingerprint,
    Home,
    LogOut,
    MapPin,
    Settings,
    Shield,
    Smartphone,
    Trash2,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * MOCK DATA
 */
const USER_MOCK = {
    id: 101,
    name: "Nguyễn Văn A",
    position: "Chuyên viên Kinh doanh",
    email: "nguyenvana@quocviet.com",
    avatar: "https://i.pravatar.cc/150?img=11",
    department: "Phòng Kinh Doanh 1"
};

const TASKS_MOCK = [
    { id: 1, title: "Thiết kế Banner Tết", deadline: "2026-01-22", status: "new", assignee: "Sếp Tổng", description: "Banner chính cho chiến dịch Marketing" },
    { id: 2, title: "Báo cáo doanh thu Q1", deadline: "2026-01-20", status: "due_soon", assignee: "Trưởng phòng", description: "Cần nộp trước 17:00 chiều nay" },
    { id: 3, title: "Họp triển khai dự án X", deadline: "2026-01-18", status: "overdue", assignee: "Giám đốc", description: "Đã quá hạn 2 ngày" },
    { id: 4, title: "Đặt lịch khách hàng VIP", deadline: "2026-01-25", status: "new", assignee: "Trưởng nhóm", description: "Khách hàng cty ABC" },
];

const NOTIFICATIONS_MOCK = [
    { id: 1, title: "Thông báo chấm công", message: "Bạn đã chấm công thành công lúc 08:05", time: "10 phút trước", read: false },
    { id: 2, title: "Cập nhật hệ thống", message: "Bảo trì server vào 12:00 đêm nay", time: "1 ngày trước", read: true },
];

/**
 * UTILS COMPONENTS (Glassmorphism + NativeWind v2)
 */

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl ${className}`}>
        {children}
    </div>
);

const Header = ({ title, leftAction = null, rightAction = null }) => (
    <div className="pt-12 pb-4 px-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100/50">
        <div className="flex items-center gap-3">
            {leftAction}
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
        </div>
        {rightAction}
    </div>
);

const ListItem = ({ icon: Icon, label, value, onClick, isDestructive = false, hasChevron = true }) => (
    <div
        onClick={onClick}
        className={`flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer ${isDestructive ? 'text-red-500' : 'text-gray-900'}`}
    >
        <div className="flex items-center gap-3">
            {Icon && <Icon size={20} className={isDestructive ? "text-red-500" : "text-gray-500"} />}
            <span className="font-medium text-[16px]">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {value && <span className="text-gray-400 text-sm">{value}</span>}
            {hasChevron && <ChevronRight size={18} className="text-gray-300" />}
        </div>
    </div>
);

const PrimaryButton = ({ label, onClick, disabled = false, className = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-3.5 rounded-xl font-semibold text-white text-[16px] active:scale-95 transition-transform shadow-lg shadow-blue-500/30 ${disabled ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700'} ${className}`}
    >
        {label}
    </button>
);

/**
 * SCREENS
 */

// 1. HOME SCREEN
const HomeScreen = () => {
    return (
        <div className="pb-32">
            <Header
                title="Trang chủ"
                rightAction={<div className="bg-gray-100 p-2 rounded-full"><User size={20} className="text-gray-600" /></div>}
            />

            <div className="px-4 mt-2">
                <div className="mb-6">
                    <p className="text-gray-500 text-sm">Thứ Hai, 20/01/2026</p>
                    <h2 className="text-2xl font-bold text-gray-800">Xin chào, {USER_MOCK.name} 👋</h2>
                </div>

                <GlassCard className="p-4 mb-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700">Hiệu suất tháng 1</h3>
                        <span className="text-blue-600 text-sm font-bold bg-blue-50 px-2 py-1 rounded-lg">98%</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="flex-1 bg-white/60 p-3 rounded-xl text-center">
                            <div className="text-2xl font-bold text-gray-800">18</div>
                            <div className="text-xs text-gray-500">Công chấm</div>
                        </div>
                        <div className="flex-1 bg-white/60 p-3 rounded-xl text-center">
                            <div className="text-2xl font-bold text-orange-500">1</div>
                            <div className="text-xs text-gray-500">Đi muộn</div>
                        </div>
                        <div className="flex-1 bg-white/60 p-3 rounded-xl text-center">
                            <div className="text-2xl font-bold text-green-600">5</div>
                            <div className="text-xs text-gray-500">Hoàn thành</div>
                        </div>
                    </div>
                </GlassCard>

                <h3 className="font-semibold text-gray-700 mb-3 px-1">Tiện ích nhanh</h3>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: "Đơn từ", icon: FileText, color: "bg-orange-100 text-orange-600" },
                        { label: "Bảng lương", icon: Smartphone, color: "bg-green-100 text-green-600" },
                        { label: "Quy định", icon: Shield, color: "bg-purple-100 text-purple-600" },
                        { label: "Cài đặt", icon: Settings, color: "bg-gray-100 text-gray-600" },
                    ].map((item, index) => (
                        <GlassCard key={index} className="p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer h-32">
                            <div className={`p-3 rounded-full ${item.color}`}>
                                <item.icon size={24} />
                            </div>
                            <span className="font-medium text-gray-700">{item.label}</span>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 2. TASK SCREEN (NEW - 3 States)
const TaskScreen = () => {
    const [filter, setFilter] = useState('all');

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'due_soon': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'new': return 'Mới giao';
            case 'due_soon': return 'Sắp hết hạn';
            case 'overdue': return 'Quá hạn';
            default: return '';
        }
    };

    const filteredTasks = filter === 'all'
        ? TASKS_MOCK
        : TASKS_MOCK.filter(t => t.status === filter);

    const FilterChip = ({ id, label, colorClass }) => (
        <button
            onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === id
                ? `${colorClass} shadow-sm ring-1 ring-inset`
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="pb-32 h-full flex flex-col">
            <Header
                title="Nhiệm vụ"
                rightAction={<button className="text-blue-600 text-sm font-semibold active:opacity-60">Thêm mới</button>}
            />

            <div className="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar bg-gray-50/50 backdrop-blur-sm sticky top-[88px] z-10 border-b border-gray-100/50">
                <FilterChip id="all" label="Tất cả" colorClass="bg-gray-800 text-white border-gray-800" />
                <FilterChip id="new" label="Mới giao" colorClass="bg-blue-500 text-white border-blue-500" />
                <FilterChip id="due_soon" label="Sắp hết hạn" colorClass="bg-orange-500 text-white border-orange-500" />
                <FilterChip id="overdue" label="Quá hạn" colorClass="bg-red-500 text-white border-red-500" />
            </div>

            <div className="flex-1 px-4 mt-4 space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <ClipboardList size={48} className="text-gray-400 mb-4" />
                        <p className="text-gray-500">Không có nhiệm vụ nào</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <GlassCard key={task.id} className="p-4 active:scale-[0.98] transition-transform cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(task.status)}`}>
                                    {getStatusLabel(task.status)}
                                </span>
                                {task.status === 'overdue' && <AlertTriangle size={16} className="text-red-500" />}
                            </div>

                            <h3 className="text-gray-900 font-bold text-lg mb-1 leading-snug">{task.title}</h3>
                            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{task.description}</p>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                        {task.assignee.charAt(0)}
                                    </div>
                                    <span className="text-xs text-gray-500">{task.assignee}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                    <Calendar size={14} />
                                    <span>{task.deadline}</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
};

// 3. CHECK-IN SCREEN
const CheckInScreen = () => {
    const [step, setStep] = useState(0);
    const [showDisclosure, setShowDisclosure] = useState(false);
    const [locationStatus, setLocationStatus] = useState("idle");
    const [faceStatus, setFaceStatus] = useState("idle");

    const confirmDisclosure = () => {
        setShowDisclosure(false);
        setStep(1);
        setLocationStatus("checking");
        setTimeout(() => {
            setLocationStatus("valid");
        }, 2000);
    };

    useEffect(() => {
        if (step === 2) {
            setFaceStatus("scanning");
            setTimeout(() => {
                setFaceStatus("valid");
                setTimeout(() => setStep(3), 1000);
            }, 3000);
        }
    }, [step]);

    return (
        <div className="pb-32 h-full flex flex-col">
            <Header title="Chấm công" />

            {showDisclosure && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <MapPin className="text-blue-600" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-center mb-2">Sử dụng vị trí của bạn</h3>
                        <p className="text-gray-600 text-center mb-6 text-sm">
                            Quốc Việt Super App thu thập dữ liệu vị trí để xác thực địa điểm chấm công hợp lệ ngay cả khi ứng dụng đang đóng.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDisclosure(false)} className="flex-1 py-3 text-gray-600 font-medium active:scale-95 transition-transform">Từ chối</button>
                            <button onClick={confirmDisclosure} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium active:scale-95 transition-transform">Đồng ý</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 px-4 flex flex-col items-center justify-center min-h-[500px]">
                {step === 0 && (
                    <div className="w-full text-center">
                        <div className="w-40 h-40 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-white shadow-xl">
                            <Fingerprint size={64} className="text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Sẵn sàng chấm công?</h2>
                        <p className="text-gray-500 mb-8">Hãy đảm bảo bạn đang đứng tại văn phòng.</p>
                        <PrimaryButton label="Bắt đầu Check-in" onClick={() => setShowDisclosure(true)} />
                    </div>
                )}

                {step === 1 && (
                    <div className="w-full animate-in slide-in-from-right duration-300">
                        <GlassCard className="p-6 text-center">
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${locationStatus === 'checking' ? 'bg-yellow-100 animate-pulse' : 'bg-green-100'}`}>
                                <MapPin size={32} className={locationStatus === 'checking' ? 'text-yellow-600' : 'text-green-600'} />
                            </div>
                            <h3 className="font-bold text-lg mb-1">{locationStatus === 'checking' ? 'Đang định vị...' : 'Vị trí hợp lệ!'}</h3>
                            {locationStatus === 'valid' && (
                                <PrimaryButton label="Tiếp tục: Xác thực khuôn mặt" onClick={() => setStep(2)} className="mt-4" />
                            )}
                        </GlassCard>
                    </div>
                )}

                {step === 2 && (
                    <div className="w-full relative h-[400px] bg-black rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="absolute inset-0 flex items-center justify-center"><p className="text-white/50">Camera View Mock</p></div>
                        <div className="absolute inset-0 border-[40px] border-black/50 rounded-[40%] m-12"></div>
                        <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent text-center">
                            <p className="text-white font-medium">{faceStatus === 'scanning' ? 'Giữ khuôn mặt trong khung...' : 'Xác thực thành công!'}</p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center animate-in zoom-in duration-300">
                        <CheckCircle size={80} className="text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Chấm công thành công!</h2>
                        <div className="mt-8"><button onClick={() => setStep(0)} className="text-blue-600 font-medium hover:underline">Về trang chủ</button></div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 4. NOTIFICATION SCREEN
const NotificationScreen = () => {
    return (
        <div className="pb-32">
            <Header title="Thông báo" />
            <div className="px-4">
                {NOTIFICATIONS_MOCK.map((noti) => (
                    <GlassCard key={noti.id} className={`mb-3 p-4 flex gap-3 ${!noti.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                        <div className={`mt-1 min-w-[10px] h-[10px] rounded-full ${!noti.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                        <div>
                            <h4 className={`text-sm mb-1 ${!noti.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{noti.title}</h4>
                            <p className="text-sm text-gray-500 mb-2">{noti.message}</p>
                            <span className="text-xs text-gray-400">{noti.time}</span>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};

// 5. SETTINGS SCREEN (Sub-screen of Profile)
const SettingsScreen = ({ onBack }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleLogout = () => {
        alert("Đã đăng xuất & Xóa Token khỏi SecureStore");
    };

    const handleDeleteAccount = () => {
        setShowDeleteConfirm(false);
        alert("Yêu cầu đã gửi. Tài khoản sẽ bị xóa sau 30 ngày.");
    };

    return (
        <div className="bg-gray-50 min-h-full pb-32 absolute inset-0 z-30 animate-in slide-in-from-right duration-300 flex flex-col">
            <Header
                title="Cài đặt & Riêng tư"
                leftAction={
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-gray-200 transition-colors">
                        <ChevronLeft size={24} className="text-blue-600" />
                    </button>
                }
            />

            <div className="px-4 mt-2 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                {/* Section 1: Legal */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-4">Pháp lý</h3>
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                        <ListItem icon={FileText} label="Điều khoản sử dụng (EULA)" onClick={() => { }} />
                        <ListItem icon={Shield} label="Chính sách bảo mật" onClick={() => { }} />
                    </div>
                </div>

                {/* Section 2: Account Actions (Logout is here) */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-4">Tài khoản</h3>
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                        <ListItem icon={LogOut} label="Đăng xuất" onClick={handleLogout} />
                    </div>
                </div>

                {/* Section 3: Danger Zone (Delete Account is here) */}
                <div>
                    <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 ml-4">Vùng nguy hiểm</h3>
                    <div className="bg-white rounded-xl overflow-hidden border border-red-100">
                        <ListItem
                            icon={Trash2}
                            label="Yêu cầu xóa tài khoản"
                            isDestructive={true}
                            onClick={() => setShowDeleteConfirm(true)}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 ml-4">
                        Theo chính sách App Store, bạn có quyền yêu cầu xóa toàn bộ dữ liệu cá nhân khỏi hệ thống.
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-xs p-6 text-center animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa tài khoản?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Dữ liệu sẽ bị xóa vĩnh viễn sau <span className="font-bold text-gray-800">30 ngày</span>. Bạn có chắc chắn không?
                        </p>
                        <div className="space-y-3">
                            <button onClick={handleDeleteAccount} className="w-full py-3 bg-red-500 text-white rounded-xl font-medium active:scale-95 transition-transform">
                                Gửi yêu cầu xóa
                            </button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3 text-gray-500 font-medium active:scale-95 transition-transform">
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 6. PROFILE MAIN SCREEN
const ProfileScreen = () => {
    const [showSettings, setShowSettings] = useState(false);

    // Reanimated v3 simulation: Conditional rendering with slide animation
    if (showSettings) {
        return <SettingsScreen onBack={() => setShowSettings(false)} />;
    }

    return (
        <div className="pb-32 animate-in fade-in duration-300">
            <Header title="Tài khoản" />
            <div className="px-4 mt-4">
                <GlassCard className="p-6 flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden mb-4">
                        <img src={USER_MOCK.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{USER_MOCK.name}</h2>
                    <p className="text-blue-600 font-medium">{USER_MOCK.position}</p>
                </GlassCard>

                {/* Menu chỉ còn các mục chính, nút Logout/Delete đã ẩn vào trong Settings */}
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <ListItem icon={User} label="Thông tin cá nhân" value="Chỉnh sửa" onClick={() => { }} />
                    <ListItem icon={Fingerprint} label="Cài đặt sinh trắc học" value="Bật" onClick={() => { }} />
                    <ListItem
                        icon={Settings}
                        label="Cài đặt & Riêng tư"
                        onClick={() => setShowSettings(true)} // Open Sub-screen
                    />
                </div>
            </div>
        </div>
    );
};

// TAB BAR NAVIGATION
const TabBar = ({ currentTab, onTabChange }) => {
    const tabs = [
        { id: 'home', icon: Home, label: 'Trang chủ' },
        { id: 'task', icon: ClipboardList, label: 'Việc', badge: 3 },
        { id: 'checkin', icon: MapPin, label: 'Chấm công' },
        { id: 'noti', icon: Bell, label: 'Thông báo' },
        { id: 'profile', icon: User, label: 'Cá nhân' },
    ];

    return (
        <div className="absolute bottom-0 left-0 right-0 z-50">
            <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200 pb-safe pt-2 px-2 flex justify-around items-center rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)] h-[85px]">
                {tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center justify-center w-full h-full relative transition-all duration-200 group active:scale-95`}
                        >
                            <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-50 text-blue-600 -translate-y-1' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                <tab.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                                {tab.badge && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white shadow-sm">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] mt-0.5 font-semibold transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// MAIN APP CONTAINER
export default function App() {
    const [currentTab, setCurrentTab] = useState('home');

    const renderScreen = () => {
        switch (currentTab) {
            case 'home': return <HomeScreen />;
            case 'task': return <TaskScreen />;
            case 'checkin': return <CheckInScreen />;
            case 'noti': return <NotificationScreen />;
            case 'profile': return <ProfileScreen />; // Handles both Profile & Settings Sub-screen
            default: return <HomeScreen />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center py-4 font-sans text-gray-900 selection:bg-blue-100">
            <div className="w-full max-w-[400px] h-[95vh] max-h-[850px] bg-gray-50 rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-gray-900 ring-4 ring-gray-300 flex flex-col">

                {/* Notch & Status Bar */}
                <div className="absolute top-0 left-0 right-0 h-12 z-50 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl flex items-center justify-center">
                        <div className="w-16 h-4 bg-black rounded-full"></div>
                    </div>
                    <div className="absolute top-3 right-6 flex gap-1.5">
                        <div className="w-4 h-4 rounded-full border border-black/20"></div>
                        <div className="w-4 h-4 bg-black/80 rounded-sm"></div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-gray-50 relative">
                    {renderScreen()}
                </div>

                {/* Bottom Navigation */}
                <TabBar currentTab={currentTab} onTabChange={setCurrentTab} />

                {/* Home Indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-[60] pointer-events-none"></div>
            </div>
        </div>
    );
}