"use server";

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * 调试 API：查看当前 session 信息
 * 仅用于调试，生产环境建议删除
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({
        status: "not_logged_in",
        session: null,
      });
    }

    // 返回 session 信息（隐藏敏感数据）
    return NextResponse.json({
      status: "logged_in",
      session: {
        user: {
          id: session.user?.id,
          name: session.user?.name,
          email: session.user?.email,
          // 自定义字段
          ...(() => {
            const user = session.user as Record<string, unknown>;
            return {
              provider: user?.provider,
              username: user?.username,
              trustLevel: user?.trustLevel,
              role: user?.role,
            };
          })(),
        },
        expires: session.expires,
      },
    });
  } catch (error) {
    console.error("[Debug Session] Error:", error);
    return NextResponse.json({
      status: "error",
      message: String(error),
    }, { status: 500 });
  }
}

